#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import shutil
import signal
import subprocess
import tempfile
import threading
import time
import traceback
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse


ROOT = Path(tempfile.gettempdir()) / "nuvio-hls"
SESSIONS = {}
SESSION_LOCK = threading.Lock()
CONFIG = {
    "quality": "auto",
    "max_sessions": 3,
    "idle_ttl": 20 * 60,
    "playlist_timeout": 35,
}

QUALITY = {
    "auto": {"height": 1080, "video_bitrate": "5500k", "bufsize": "11000k", "crf": "24"},
    "1080p": {"height": 1080, "video_bitrate": "5500k", "bufsize": "11000k", "crf": "24"},
    "720p": {"height": 720, "video_bitrate": "3200k", "bufsize": "6400k", "crf": "25"},
    "480p": {"height": 480, "video_bitrate": "1600k", "bufsize": "3200k", "crf": "26"},
    "copy": {"height": 0, "video_bitrate": "", "bufsize": "", "crf": ""},
}


class Session:
    def __init__(self, key, out_dir, playlist, process, cmd, mode):
        self.key = key
        self.out_dir = out_dir
        self.playlist = playlist
        self.process = process
        self.cmd = cmd
        self.mode = mode
        self.created_at = time.time()
        self.last_access = time.time()

    def alive(self):
        return self.process and self.process.poll() is None

    def touch(self):
        self.last_access = time.time()

    def stop(self):
        if not self.alive():
            return
        try:
            self.process.terminate()
            self.process.wait(timeout=4)
        except Exception:
            try:
                self.process.kill()
            except Exception:
                pass


class Handler(SimpleHTTPRequestHandler):
    server_version = "NuvioTranscoder/2.0"

    def log_message(self, fmt, *args):
        print("%s - - [%s] %s" % (self.client_address[0], self.log_date_time_string(), fmt % args))

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range, Origin, Accept, Content-Type")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def translate_path(self, path):
        parsed = urlparse(path)
        parts = parsed.path.strip("/").split("/")
        query = parse_qs(parsed.query)

        if len(parts) >= 3 and parts[0] == "hlsv2":
            media_url = query.get("mediaURL", [""])[0]
            quality = normalize_quality(query.get("quality", [CONFIG["quality"]])[0])
            seek_seconds = parse_int(query.get("seek", ["0"])[0])
            session = session_key(parts[1], media_url, seek_seconds, quality) if media_url else safe_name(parts[1])
            return str(ROOT / "hlsv2" / session / "/".join(parts[2:]))

        return str(ROOT / parsed.path.lstrip("/"))

    def send_json(self, payload, status=200):
        data = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        if parsed.path == "/health":
            self.send_json(build_health())
            return

        if parsed.path == "/shutdown":
            stop_all_sessions()
            self.send_json({"ok": True})
            return

        if parsed.path.endswith("/video0.m3u8") and query.get("mediaURL"):
            try:
                session = parsed.path.strip("/").split("/")[1]
                media_url = query["mediaURL"][0]
                seek_seconds = parse_int(query.get("seek", ["0"])[0])
                quality = normalize_quality(query.get("quality", [CONFIG["quality"]])[0])
                playlist = ensure_hls(session, media_url, seek_seconds, quality)
                if not wait_for_file(playlist, CONFIG["playlist_timeout"]):
                    self.send_error(503, "Playlist is not ready. ffmpeg may still be buffering or failed.")
                    return
            except Exception as error:
                traceback.print_exc()
                self.send_error(500, str(error))
                return

        return super().do_GET()


def safe_name(value):
    return unquote(value).replace("/", "_").replace("\\", "_").replace(":", "_")


def parse_int(value):
    try:
        return max(0, int(float(value or 0)))
    except Exception:
        return 0


def normalize_quality(value):
    value = str(value or CONFIG["quality"]).lower()
    return value if value in QUALITY else CONFIG["quality"]


def require_tool(name):
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"{name} is required and was not found on PATH.")
    return path


def wait_for_file(path, timeout):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if path.exists() and path.stat().st_size > 0:
            return True
        time.sleep(0.25)
    return False


def probe_media(media_url):
    ffprobe = shutil.which("ffprobe")
    if not ffprobe:
        return {}

    cmd = [
        ffprobe,
        "-v", "error",
        "-print_format", "json",
        "-show_streams",
        media_url,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
    except Exception:
        return {}

    if result.returncode != 0:
        return {}

    try:
        return json.loads(result.stdout or "{}")
    except Exception:
        return {}


def get_first_stream(probe, kind):
    for stream in probe.get("streams", []):
        if stream.get("codec_type") == kind:
            return stream
    return {}


def can_copy_video(video_stream, quality):
    codec = (video_stream.get("codec_name") or "").lower()
    width = int(video_stream.get("width") or 0)
    height = int(video_stream.get("height") or 0)

    if quality != "copy":
        return False
    if codec not in ("h264", "hevc"):
        return False
    return width <= 3840 and height <= 2160


def build_video_args(video_stream, quality):
    settings = QUALITY[quality]

    if can_copy_video(video_stream, quality):
        return ["-c:v", "copy"], "copy-video"

    vf = []
    if settings["height"]:
        vf = ["-vf", "scale=-2:min(%d\\,ih)" % settings["height"]]

    return [
        *vf,
        "-c:v", "libx264",
        "-preset", "superfast",
        "-tune", "zerolatency",
        "-crf", settings["crf"],
        "-maxrate", settings["video_bitrate"],
        "-bufsize", settings["bufsize"],
        "-pix_fmt", "yuv420p",
    ], "transcode-video"


def session_key(session, media_url, seek_seconds, quality):
    digest = hashlib.sha1(media_url.encode("utf-8")).hexdigest()[:12]
    return f"{safe_name(session)}_{digest}_q_{quality}_seek_{seek_seconds}"


def ensure_hls(session, media_url, seek_seconds=0, quality="auto"):
    ffmpeg = require_tool("ffmpeg")
    cleanup_sessions()

    key = session_key(session, media_url, seek_seconds, quality)
    out_dir = ROOT / "hlsv2" / key
    playlist = out_dir / "video0.m3u8"
    out_dir.mkdir(parents=True, exist_ok=True)

    with SESSION_LOCK:
        existing = SESSIONS.get(key)
        if existing:
            existing.touch()
            if existing.alive() or playlist.exists():
                return playlist
            SESSIONS.pop(key, None)

    probe = probe_media(media_url)
    video_stream = get_first_stream(probe, "video")
    video_args, mode = build_video_args(video_stream, quality)
    segment = out_dir / "segment_%05d.ts"

    cmd = [
        ffmpeg,
        "-hide_banner",
        "-loglevel", "warning",
        "-nostdin",
        "-fflags", "+genpts",
        "-analyzeduration", "100M",
        "-probesize", "100M",
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
    ]
    if seek_seconds > 0:
        cmd += ["-ss", str(seek_seconds)]
    cmd += [
        "-i", media_url,
        "-map", "0:v:0",
        "-map", "0:a:0?",
        "-map_metadata", "-1",
        "-sn",
        "-dn",
        *video_args,
        "-c:a", "aac",
        "-b:a", "192k",
        "-ac", "2",
        "-f", "hls",
        "-hls_time", "4",
        "-hls_list_size", "0",
        "-hls_playlist_type", "event",
        "-hls_flags", "independent_segments+temp_file",
        "-hls_segment_filename", str(segment),
        str(playlist),
    ]

    print(f"Starting ffmpeg session {key} ({mode}, quality={quality}, seek={seek_seconds}s)")
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    session_obj = Session(key, out_dir, playlist, process, cmd, mode)

    with SESSION_LOCK:
        SESSIONS[key] = session_obj
        enforce_session_limit()

    threading.Thread(target=log_process_errors, args=(session_obj,), daemon=True).start()
    return playlist


def log_process_errors(session):
    if not session.process or not session.process.stderr:
        return

    for line in session.process.stderr:
        line = line.strip()
        if line:
            print(f"[ffmpeg:{session.key}] {line}")


def cleanup_sessions():
    now = time.time()
    with SESSION_LOCK:
        stale = [
            key for key, session in SESSIONS.items()
            if (not session.alive() and not session.playlist.exists())
            or (now - session.last_access > CONFIG["idle_ttl"])
        ]
        for key in stale:
            session = SESSIONS.pop(key, None)
            if session:
                session.stop()


def enforce_session_limit():
    if len(SESSIONS) <= CONFIG["max_sessions"]:
        return

    ordered = sorted(SESSIONS.values(), key=lambda item: item.last_access)
    for session in ordered[:max(0, len(SESSIONS) - CONFIG["max_sessions"])]:
        SESSIONS.pop(session.key, None)
        session.stop()


def stop_all_sessions():
    with SESSION_LOCK:
        sessions = list(SESSIONS.values())
        SESSIONS.clear()
    for session in sessions:
        session.stop()


def build_health():
    cleanup_sessions()
    with SESSION_LOCK:
        sessions = [
            {
                "key": session.key,
                "mode": session.mode,
                "alive": session.alive(),
                "ageSeconds": round(time.time() - session.created_at, 1),
                "idleSeconds": round(time.time() - session.last_access, 1),
                "playlist": str(session.playlist),
            }
            for session in SESSIONS.values()
        ]
    return {
        "ok": True,
        "root": str(ROOT),
        "ffmpeg": shutil.which("ffmpeg"),
        "ffprobe": shutil.which("ffprobe"),
        "sessions": sessions,
        "config": CONFIG,
    }


def handle_shutdown(signum, frame):
    stop_all_sessions()
    raise SystemExit(0)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=17870)
    parser.add_argument("--quality", choices=sorted(QUALITY.keys()), default="auto")
    parser.add_argument("--max-sessions", type=int, default=3)
    args = parser.parse_args()

    CONFIG["quality"] = args.quality
    CONFIG["max_sessions"] = max(1, args.max_sessions)

    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    ROOT.mkdir(parents=True, exist_ok=True)
    os.chdir(ROOT)
    print(f"Nuvio transcoder listening on http://{args.host}:{args.port}")
    print(f"Quality={CONFIG['quality']} maxSessions={CONFIG['max_sessions']}")
    print("Requires ffmpeg and ffprobe on PATH.")
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()

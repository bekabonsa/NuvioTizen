#!/usr/bin/env python3
import json
import mimetypes
import os
import re
import sys
import time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

QBT_URL = os.environ.get("QBITTORRENT_URL", "http://127.0.0.1:8080").rstrip("/")
QBT_USERNAME = os.environ.get("QBITTORRENT_USERNAME", "admin")
QBT_PASSWORD = os.environ.get("QBITTORRENT_PASSWORD", "")
BRIDGE_TOKEN = os.environ.get("BRIDGE_TOKEN", "")
BRIDGE_PORT = int(os.environ.get("BRIDGE_PORT", "8788"))
DOWNLOAD_ROOT = Path(os.environ.get("DOWNLOAD_ROOT", "/srv/torrents/downloads")).resolve()
METADATA_ROOT = Path(os.environ.get("METADATA_ROOT", "/srv/torrents/metadata")).resolve()

HASH_RE = re.compile(r"^[a-fA-F0-9]{40}$|^[a-zA-Z2-7]{32}$")
VIDEO_EXTENSIONS = (".mkv", ".mp4", ".avi", ".mov", ".m4v", ".webm")
METADATA_KEYS = {
    "itemId",
    "itemName",
    "itemType",
    "poster",
    "background",
    "videoId",
    "videoTitle",
    "season",
    "episode",
    "streamTitle",
}

session = requests.Session()
last_login = 0


def qbt_login():
    global last_login
    if time.time() - last_login < 300:
        return
    response = session.post(
        QBT_URL + "/api/v2/auth/login",
        data={"username": QBT_USERNAME, "password": QBT_PASSWORD},
        timeout=10,
    )
    response.raise_for_status()
    if response.text.strip() != "Ok.":
        raise RuntimeError("qBittorrent login failed")
    last_login = time.time()


def qbt_get(path, **params):
    qbt_login()
    response = session.get(QBT_URL + path, params=params, timeout=15)
    if response.status_code == 403:
        global last_login
        last_login = 0
        qbt_login()
        response = session.get(QBT_URL + path, params=params, timeout=15)
    response.raise_for_status()
    return response


def qbt_post(path, data=None, files=None):
    qbt_login()
    response = session.post(QBT_URL + path, data=data or {}, files=files, timeout=30)
    if response.status_code == 403:
        global last_login
        last_login = 0
        qbt_login()
        response = session.post(QBT_URL + path, data=data or {}, files=files, timeout=30)
    response.raise_for_status()
    return response


def magnet_from_payload(payload):
    magnet = str(payload.get("magnet") or "").strip()
    info_hash = str(payload.get("infoHash") or payload.get("info_hash") or "").strip()
    if magnet.startswith("magnet:?"):
        return magnet
    if info_hash and HASH_RE.match(info_hash):
        return "magnet:?xt=urn:btih:" + info_hash
    raise ValueError("Expected magnet or valid infoHash")


def hash_from_magnet(magnet):
    match = re.search(r"xt=urn:btih:([^&]+)", magnet, re.I)
    return match.group(1).lower() if match else ""


def torrent_info(torrent_hash):
    items = qbt_get("/api/v2/torrents/info", hashes=torrent_hash).json()
    return items[0] if items else None


def torrents_info():
    return qbt_get("/api/v2/torrents/info").json()


def torrent_files(torrent_hash):
    return qbt_get("/api/v2/torrents/files", hash=torrent_hash).json()


def selected_file(torrent_hash, index=None):
    files = torrent_files(torrent_hash)
    if not files:
        return None
    if index is not None:
        for item in files:
            if int(item.get("index", -1)) == int(index):
                return item
    video_files = [item for item in files if str(item.get("name", "")).lower().endswith(VIDEO_EXTENSIONS)]
    return max(video_files or files, key=lambda item: int(item.get("size") or 0))


def metadata_path(torrent_hash):
    clean_hash = str(torrent_hash or "").strip().lower()
    if not HASH_RE.match(clean_hash):
        raise ValueError("Invalid torrent hash")
    return METADATA_ROOT / f"{clean_hash}.json"


def read_metadata(torrent_hash):
    try:
        path = metadata_path(torrent_hash)
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload if isinstance(payload, dict) else {}
    except Exception:
        return {}


def normalize_metadata(payload):
    raw = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
    metadata = {}
    for key in METADATA_KEYS:
        value = raw.get(key)
        if value is None or value == "":
            continue
        metadata[key] = value
    title = str(payload.get("title") or "").strip()
    if title and "streamTitle" not in metadata:
        metadata["streamTitle"] = title
    metadata["cachedAt"] = int(time.time())
    return metadata


def write_metadata(torrent_hash, metadata):
    if not metadata:
        return
    METADATA_ROOT.mkdir(parents=True, exist_ok=True)
    path = metadata_path(torrent_hash)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, ensure_ascii=True, separators=(",", ":"))


def remove_metadata(torrent_hash):
    try:
        metadata_path(torrent_hash).unlink(missing_ok=True)
    except Exception:
        pass


def safe_file_path(info, file_item):
    save_path = Path(info.get("save_path") or DOWNLOAD_ROOT).resolve()
    relative = Path(str(file_item.get("name") or ""))
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError("Unsafe torrent file path")
    path = (save_path / relative).resolve()
    root = save_path.resolve()
    if root not in path.parents and path != root:
        raise ValueError("Torrent file escaped save path")
    return path


def public_base(handler):
    host = handler.headers.get("Host", "")
    proto = handler.headers.get("X-Forwarded-Proto", "http")
    return proto + "://" + host


def make_status(handler, torrent_hash, preferred_index=None, info=None):
    info = info or torrent_info(torrent_hash)
    if not info:
        return {"hash": torrent_hash, "found": False, "ready": False}
    torrent_hash = str(info.get("hash") or torrent_hash).lower()
    file_item = selected_file(torrent_hash, preferred_index)
    stream_url = None
    file_exists = False
    if file_item:
        try:
            path = safe_file_path(info, file_item)
            file_exists = path.exists() and path.stat().st_size > 0
        except Exception:
            file_exists = False
        if file_exists:
            token = parse_qs(urlparse(handler.path).query).get("token", [""])[0] or BRIDGE_TOKEN
            file_index = int(file_item.get("index", 0))
            stream_url = f"{public_base(handler)}/stream/{torrent_hash}/{file_index}?token={token}"
    return {
        "hash": torrent_hash,
        "found": True,
        "ready": bool(stream_url),
        "name": info.get("name"),
        "state": info.get("state"),
        "progress": info.get("progress"),
        "downloadSpeed": info.get("dlspeed"),
        "eta": info.get("eta"),
        "seeds": info.get("num_seeds"),
        "size": info.get("size"),
        "totalSize": info.get("total_size"),
        "amountLeft": info.get("amount_left"),
        "addedOn": info.get("added_on"),
        "completedOn": info.get("completion_on"),
        "savePath": info.get("save_path"),
        "file": file_item,
        "metadata": read_metadata(torrent_hash),
        "streamUrl": stream_url,
    }


def list_statuses(handler):
    statuses = []
    for item in torrents_info():
        torrent_hash = str(item.get("hash") or "").lower()
        if not torrent_hash:
            continue
        try:
            statuses.append(make_status(handler, torrent_hash, None, item))
        except Exception as error:
            statuses.append({
                "hash": torrent_hash,
                "found": True,
                "ready": False,
                "name": item.get("name"),
                "state": item.get("state"),
                "progress": item.get("progress"),
                "error": str(error),
                "metadata": read_metadata(torrent_hash),
            })
    statuses.sort(key=lambda item: item.get("addedOn") or item.get("metadata", {}).get("cachedAt") or 0, reverse=True)
    return statuses


class Handler(BaseHTTPRequestHandler):
    server_version = "NuvioBridge/0.1"

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % args))

    def authorized(self):
        if not BRIDGE_TOKEN:
            return False
        auth = self.headers.get("Authorization", "")
        query_token = parse_qs(urlparse(self.path).query).get("token", [""])[0]
        return auth == "Bearer " + BRIDGE_TOKEN or query_token == BRIDGE_TOKEN

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, Range, Accept")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        self.send_header("Access-Control-Max-Age", "86400")

    def send_json(self, code, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"ok": True})
            return
        if not self.authorized():
            self.send_json(401, {"error": "Unauthorized"})
            return
        if parsed.path == "/api/torrents":
            self.send_json(200, {"items": list_statuses(self)})
            return
        status_match = re.match(r"^/api/torrents/([^/]+)$", parsed.path)
        if status_match:
            params = parse_qs(parsed.query)
            index = params.get("fileIndex", [None])[0]
            self.send_json(200, make_status(self, status_match.group(1), index))
            return
        stream_match = re.match(r"^/stream/([^/]+)/(\d+)$", parsed.path)
        if stream_match:
            self.stream_file(stream_match.group(1), int(stream_match.group(2)))
            return
        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if not self.authorized():
            self.send_json(401, {"error": "Unauthorized"})
            return
        if urlparse(self.path).path != "/api/torrents":
            self.send_json(404, {"error": "Not found"})
            return
        try:
            payload = self.read_json()
            magnet = magnet_from_payload(payload)
            torrent_hash = hash_from_magnet(magnet)
            metadata = normalize_metadata(payload)
            qbt_post(
                "/api/v2/torrents/add",
                data={
                    "urls": magnet,
                    "savepath": str(DOWNLOAD_ROOT),
                    "sequentialDownload": "true",
                    "firstLastPiecePrio": "true",
                    "paused": "false",
                },
            )
            write_metadata(torrent_hash, metadata)
            self.send_json(202, make_status(self, torrent_hash, payload.get("fileIndex")))
        except Exception as error:
            self.send_json(400, {"error": str(error)})

    def do_DELETE(self):
        if not self.authorized():
            self.send_json(401, {"error": "Unauthorized"})
            return

        parsed = urlparse(self.path)
        match = re.match(r"^/api/torrents/([^/]+)$", parsed.path)
        if not match:
            self.send_json(404, {"error": "Not found"})
            return

        torrent_hash = match.group(1).strip().lower()
        if not HASH_RE.match(torrent_hash):
            self.send_json(400, {"error": "Invalid torrent hash"})
            return

        params = parse_qs(parsed.query)
        delete_files = params.get("deleteFiles", ["1"])[0] not in ("0", "false", "False", "no")
        try:
            qbt_post(
                "/api/v2/torrents/delete",
                data={
                    "hashes": torrent_hash,
                    "deleteFiles": "true" if delete_files else "false",
                },
            )
            remove_metadata(torrent_hash)
            self.send_json(200, {"ok": True, "hash": torrent_hash, "deletedFiles": delete_files})
        except Exception as error:
            self.send_json(400, {"error": str(error)})

    def stream_file(self, torrent_hash, index):
        info = torrent_info(torrent_hash)
        if not info:
            self.send_json(404, {"error": "Torrent not found"})
            return
        file_item = selected_file(torrent_hash, index)
        if not file_item:
            self.send_json(404, {"error": "File not found"})
            return
        try:
            path = safe_file_path(info, file_item)
        except Exception as error:
            self.send_json(400, {"error": str(error)})
            return
        if not path.exists():
            self.send_json(409, {"error": "File is not ready yet"})
            return
        size = path.stat().st_size
        start, end = 0, size - 1
        range_header = self.headers.get("Range")
        if range_header:
            match = re.match(r"bytes=(\d*)-(\d*)", range_header)
            if match:
                if match.group(1):
                    start = int(match.group(1))
                if match.group(2):
                    end = min(size - 1, int(match.group(2)))
        if start >= size or end < start:
            self.send_response(416)
            self.send_cors_headers()
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return
        length = end - start + 1
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send_response(206 if range_header else 200)
        self.send_cors_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(length))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        with path.open("rb") as handle:
            handle.seek(start)
            remaining = length
            while remaining > 0:
                chunk = handle.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)


if __name__ == "__main__":
    if not BRIDGE_TOKEN:
        raise SystemExit("BRIDGE_TOKEN is required")
    DOWNLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    METADATA_ROOT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("0.0.0.0", BRIDGE_PORT), Handler)
    print(f"Nuvio bridge listening on 0.0.0.0:{BRIDGE_PORT}", flush=True)
    server.serve_forever()

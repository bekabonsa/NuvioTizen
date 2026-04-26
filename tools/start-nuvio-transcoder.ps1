$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "ffmpeg is required but was not found on PATH."
    Write-Host "Install ffmpeg, then run this script again."
    Write-Host "Example with winget: winget install Gyan.FFmpeg"
    exit 1
}

if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    Write-Host "ffprobe is required but was not found on PATH."
    Write-Host "Install ffmpeg, then run this script again."
    Write-Host "Example with winget: winget install Gyan.FFmpeg"
    exit 1
}

python "$PSScriptRoot\nuvio-transcoder.py" --host 127.0.0.1 --port 17870 --quality auto --max-sessions 3

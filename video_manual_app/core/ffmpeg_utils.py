"""Thin wrappers around the ffmpeg / ffprobe command line tools.

Everything shells out to the system binaries rather than using a Python
binding, so the only external requirement is a working ffmpeg install
(``ffmpeg`` and ``ffprobe`` on PATH).
"""
from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass


class FfmpegNotFoundError(RuntimeError):
    """Raised when the ffmpeg/ffprobe binaries can't be found on PATH."""


def check_ffmpeg_available() -> tuple[bool, bool]:
    """Return (ffmpeg_found, ffprobe_found)."""
    return (shutil.which("ffmpeg") is not None, shutil.which("ffprobe") is not None)


def require_ffmpeg() -> None:
    ffmpeg_ok, ffprobe_ok = check_ffmpeg_available()
    if not (ffmpeg_ok and ffprobe_ok):
        missing = []
        if not ffmpeg_ok:
            missing.append("ffmpeg")
        if not ffprobe_ok:
            missing.append("ffprobe")
        raise FfmpegNotFoundError(
            f"{'/'.join(missing)} が見つかりません。ffmpeg をインストールして PATH に通してください。"
        )


@dataclass
class VideoInfo:
    duration_sec: float
    size_bytes: int
    video_bitrate_bps: int | None
    audio_bitrate_bps: int | None
    width: int | None
    height: int | None

    @property
    def overall_bitrate_bps(self) -> float:
        if self.duration_sec <= 0:
            return 0.0
        return (self.size_bytes * 8) / self.duration_sec


def probe_video(path: str) -> VideoInfo:
    """Inspect a media file with ffprobe and return basic stream info."""
    require_ffmpeg()
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration,size,bit_rate",
        "-show_entries",
        "stream=width,height,bit_rate,codec_type",
        "-of",
        "json",
        path,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    data = json.loads(proc.stdout)

    fmt = data.get("format", {})
    duration = float(fmt.get("duration", 0.0) or 0.0)
    size_bytes = int(fmt.get("size", 0) or 0)

    video_bitrate = None
    audio_bitrate = None
    width = height = None
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video" and width is None:
            width = stream.get("width")
            height = stream.get("height")
            br = stream.get("bit_rate")
            if br is not None:
                video_bitrate = int(br)
        elif stream.get("codec_type") == "audio" and audio_bitrate is None:
            br = stream.get("bit_rate")
            if br is not None:
                audio_bitrate = int(br)

    return VideoInfo(
        duration_sec=duration,
        size_bytes=size_bytes,
        video_bitrate_bps=video_bitrate,
        audio_bitrate_bps=audio_bitrate,
        width=width,
        height=height,
    )


def run_ffmpeg(args: list[str], *, log_path: str | None = None) -> subprocess.CompletedProcess:
    """Run ffmpeg with the given args (excluding the leading 'ffmpeg -y')."""
    require_ffmpeg()
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if log_path:
        with open(log_path, "a", encoding="utf-8") as fh:
            fh.write(" ".join(cmd) + "\n")
            fh.write(proc.stderr or "")
            fh.write("\n")
    if proc.returncode != 0:
        raise RuntimeError(
            f"ffmpeg が失敗しました (code={proc.returncode}):\n{proc.stderr[-4000:]}"
        )
    return proc

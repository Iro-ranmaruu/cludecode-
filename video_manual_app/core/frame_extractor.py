"""Pull representative frames ("挿画") out of a video.

Primary strategy: ffmpeg scene-change detection (`select='gt(scene,T)'`),
which grabs a frame whenever the picture changes significantly -- a good
proxy for "a new step/screen in the tutorial". If that yields too few
frames (e.g. a mostly-static screen recording with small changes), we
fall back to sampling frames at a fixed time interval so the manual is
never empty.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from dataclasses import dataclass

from .ffmpeg_utils import require_ffmpeg

_PTS_RE = re.compile(r"pts_time:(?P<t>[0-9]+\.?[0-9]*)")


@dataclass
class FrameInfo:
    index: int
    timestamp_sec: float
    path: str


def _run_capture(args: list[str]) -> subprocess.CompletedProcess:
    require_ffmpeg()
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "info", *args]
    return subprocess.run(cmd, capture_output=True, text=True)


def _extract_scene_frames(
    input_path: str, output_dir: str, *, scene_threshold: float, max_frames: int
) -> list[FrameInfo]:
    os.makedirs(output_dir, exist_ok=True)
    pattern = os.path.join(output_dir, "frame_%04d.jpg")
    proc = _run_capture(
        [
            "-i",
            input_path,
            "-vf",
            f"select='gt(scene,{scene_threshold})',showinfo",
            "-vsync",
            "vfr",
            "-frames:v",
            str(max_frames),
            "-q:v",
            "2",
            pattern,
        ]
    )
    timestamps = [float(m.group("t")) for m in _PTS_RE.finditer(proc.stderr or "")]

    files = sorted(f for f in os.listdir(output_dir) if f.startswith("frame_"))
    frames: list[FrameInfo] = []
    for idx, fname in enumerate(files):
        ts = timestamps[idx] if idx < len(timestamps) else float(idx)
        frames.append(FrameInfo(idx, ts, os.path.join(output_dir, fname)))
    return frames


def _extract_interval_frames(
    input_path: str, output_dir: str, *, interval_sec: float, max_frames: int
) -> list[FrameInfo]:
    os.makedirs(output_dir, exist_ok=True)
    pattern = os.path.join(output_dir, "frame_%04d.jpg")
    fps_expr = f"1/{interval_sec}"
    proc = _run_capture(
        [
            "-i",
            input_path,
            "-vf",
            f"fps={fps_expr}",
            "-frames:v",
            str(max_frames),
            "-q:v",
            "2",
            pattern,
        ]
    )
    if proc.returncode != 0:
        raise RuntimeError(f"フレーム抽出に失敗しました:\n{proc.stderr[-2000:]}")

    files = sorted(f for f in os.listdir(output_dir) if f.startswith("frame_"))
    return [
        FrameInfo(idx, idx * interval_sec, os.path.join(output_dir, fname))
        for idx, fname in enumerate(files)
    ]


def extract_frames(
    input_path: str,
    output_dir: str,
    duration_sec: float,
    *,
    scene_threshold: float = 0.35,
    min_scene_frames: int = 3,
    fallback_interval_sec: float = 15.0,
    max_frames: int = 120,
) -> tuple[list[FrameInfo], str]:
    """Return (frames, method) where method is 'scene' or 'interval'."""
    frames = _extract_scene_frames(
        input_path, output_dir, scene_threshold=scene_threshold, max_frames=max_frames
    )
    if len(frames) >= min_scene_frames:
        return frames, "scene"

    # Not enough scene changes detected (e.g. a mostly-static recording) ->
    # fall back to sampling on a fixed interval instead.
    shutil.rmtree(output_dir, ignore_errors=True)
    interval = fallback_interval_sec
    if duration_sec > 0:
        # Don't produce more than max_frames samples for very long videos.
        min_interval = duration_sec / max_frames
        interval = max(fallback_interval_sec, min_interval)
    frames = _extract_interval_frames(
        input_path, output_dir, interval_sec=interval, max_frames=max_frames
    )
    return frames, "interval"

"""Split a video into a series of chunks, each <= a target size (MB).

Strategy
--------
1. If the source file already fits under the limit, it is used as-is
   (single "chunk") -- no quality loss, no wasted time.
2. Otherwise the whole video is re-encoded once at a bitrate chosen so
   that a fixed-length chunk stays under the size budget (with a safety
   margin, since VBV/bufsize based rate control is not perfectly exact),
   then the re-encoded stream is cut into chunks with `-c copy`
   (fast, no quality loss on the cut itself).
3. Every resulting chunk's real file size is checked; anything that
   still slipped over the limit is reported back as a warning so the
   caller can decide what to do (the file is still produced).
"""
from __future__ import annotations

import math
import os
import shutil
import tempfile
from dataclasses import dataclass, field

from .ffmpeg_utils import VideoInfo, probe_video, run_ffmpeg

MB = 1024 * 1024


@dataclass
class Chunk:
    index: int
    path: str
    size_bytes: int
    start_sec: float
    end_sec: float


@dataclass
class SplitResult:
    chunks: list[Chunk] = field(default_factory=list)
    reencoded: bool = False
    video_kbps_used: int | None = None
    audio_kbps_used: int | None = None
    chunk_duration_sec: float | None = None
    warnings: list[str] = field(default_factory=list)


def split_video_to_size(
    input_path: str,
    output_dir: str,
    *,
    max_size_mb: float = 30.0,
    target_video_kbps: int = 1200,
    target_audio_kbps: int = 128,
    min_chunk_duration_sec: float = 15.0,
    safety_margin: float = 0.90,
    preset: str = "veryfast",
) -> SplitResult:
    os.makedirs(output_dir, exist_ok=True)
    max_size_bytes = int(max_size_mb * MB)

    info: VideoInfo = probe_video(input_path)
    base_name = os.path.splitext(os.path.basename(input_path))[0]

    result = SplitResult()

    if info.size_bytes and info.size_bytes <= max_size_bytes:
        dest = os.path.join(output_dir, f"{base_name}_part000.mp4")
        if os.path.abspath(dest) != os.path.abspath(input_path):
            shutil.copyfile(input_path, dest)
        result.chunks.append(
            Chunk(0, dest, os.path.getsize(dest), 0.0, info.duration_sec)
        )
        return result

    if info.duration_sec <= 0:
        raise ValueError(f"動画の長さを取得できませんでした: {input_path}")

    video_kbps = target_video_kbps
    audio_kbps = target_audio_kbps
    total_bps = (video_kbps + audio_kbps) * 1000
    chunk_duration = (max_size_bytes * 8 * safety_margin) / total_bps

    if chunk_duration < min_chunk_duration_sec:
        # Bitrate too high for the size budget -> shrink the video bitrate
        # so chunks are at least min_chunk_duration_sec long.
        chunk_duration = min_chunk_duration_sec
        video_kbps = max(
            150,
            int((max_size_bytes * 8 * safety_margin) / min_chunk_duration_sec / 1000)
            - audio_kbps,
        )
        total_bps = (video_kbps + audio_kbps) * 1000

    result.reencoded = True
    result.video_kbps_used = video_kbps
    result.audio_kbps_used = audio_kbps
    result.chunk_duration_sec = chunk_duration

    with tempfile.TemporaryDirectory(prefix="reencode_") as tmp_dir:
        reencoded_path = os.path.join(tmp_dir, f"{base_name}_reencoded.mp4")
        run_ffmpeg(
            [
                "-i",
                input_path,
                "-c:v",
                "libx264",
                "-preset",
                preset,
                "-b:v",
                f"{video_kbps}k",
                "-maxrate",
                f"{video_kbps}k",
                "-bufsize",
                f"{video_kbps * 2}k",
                "-c:a",
                "aac",
                "-b:a",
                f"{audio_kbps}k",
                "-movflags",
                "+faststart",
                reencoded_path,
            ]
        )

        segment_pattern = os.path.join(tmp_dir, "part_%03d.mp4")
        run_ffmpeg(
            [
                "-i",
                reencoded_path,
                "-map",
                "0",
                "-c",
                "copy",
                "-f",
                "segment",
                "-segment_time",
                f"{chunk_duration:.3f}",
                "-reset_timestamps",
                "1",
                segment_pattern,
            ]
        )

        segment_files = sorted(
            f for f in os.listdir(tmp_dir) if f.startswith("part_") and f.endswith(".mp4")
        )
        if not segment_files:
            raise RuntimeError("動画の分割に失敗しました（セグメントが生成されませんでした）")

        for idx, fname in enumerate(segment_files):
            src = os.path.join(tmp_dir, fname)
            dest = os.path.join(output_dir, f"{base_name}_part{idx:03d}.mp4")
            shutil.move(src, dest)
            size_bytes = os.path.getsize(dest)
            start_sec = idx * chunk_duration
            end_sec = min(start_sec + chunk_duration, info.duration_sec)
            result.chunks.append(Chunk(idx, dest, size_bytes, start_sec, end_sec))
            if size_bytes > max_size_bytes:
                over_mb = size_bytes / MB
                result.warnings.append(
                    f"{os.path.basename(dest)} は {over_mb:.1f}MB で上限 {max_size_mb}MB を"
                    " 超過しています（ビットレート変動によるものです。動画ビットレートを"
                    "下げて再実行してください）"
                )

    return result

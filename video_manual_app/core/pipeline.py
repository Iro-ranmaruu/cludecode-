"""Glue: folder of videos -> split chunks -> frame extraction -> OCR -> HTML manual."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Callable, Optional

from . import frame_extractor, manual_builder, ocr_analyzer, splitter
from .ffmpeg_utils import check_ffmpeg_available, probe_video

VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v", ".ts", ".wmv"}

ProgressCallback = Callable[[str, Optional[float]], None]


def find_videos(folder: str, recursive: bool = False) -> list[str]:
    if recursive:
        paths = []
        for root, _, files in os.walk(folder):
            for f in files:
                if os.path.splitext(f)[1].lower() in VIDEO_EXTENSIONS:
                    paths.append(os.path.join(root, f))
        return sorted(paths)
    return sorted(
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in VIDEO_EXTENSIONS
        and os.path.isfile(os.path.join(folder, f))
    )


@dataclass
class VideoProcessResult:
    source_path: str
    manual_path: str | None
    error: str | None = None
    warnings: list[str] = field(default_factory=list)


def process_video(
    input_path: str,
    output_root: str,
    *,
    max_size_mb: float = 30.0,
    target_video_kbps: int = 1200,
    target_audio_kbps: int = 128,
    scene_threshold: float = 0.35,
    fallback_interval_sec: float = 15.0,
    ocr_lang: str = "jpn+eng",
    max_frames_per_chunk: int = 40,
    progress_cb: ProgressCallback | None = None,
) -> VideoProcessResult:
    def report(msg: str, frac: float | None = None) -> None:
        if progress_cb:
            progress_cb(msg, frac)

    base_name = os.path.splitext(os.path.basename(input_path))[0]
    video_out_dir = os.path.join(output_root, base_name)
    chunks_dir = os.path.join(video_out_dir, "chunks")
    frames_root = os.path.join(video_out_dir, "frames")

    try:
        info = probe_video(input_path)
    except Exception as exc:  # noqa: BLE001
        return VideoProcessResult(input_path, None, error=f"動画情報の取得に失敗: {exc}")

    report(f"{base_name}: 30MB以内に分割中...", 0.1)
    try:
        split_result = splitter.split_video_to_size(
            input_path,
            chunks_dir,
            max_size_mb=max_size_mb,
            target_video_kbps=target_video_kbps,
            target_audio_kbps=target_audio_kbps,
        )
    except Exception as exc:  # noqa: BLE001
        return VideoProcessResult(input_path, None, error=f"分割に失敗: {exc}")

    ocr_ready = ocr_analyzer.tesseract_available()

    all_steps: list[manual_builder.Step] = []
    method_used = "scene"
    total_chunks = max(1, len(split_result.chunks))
    for i, chunk in enumerate(split_result.chunks):
        frac = 0.2 + 0.7 * (i / total_chunks)
        report(f"{base_name}: part{chunk.index:03d} の挿画(フレーム)を抽出・分析中...", frac)
        chunk_frames_dir = os.path.join(frames_root, f"chunk_{chunk.index:03d}")
        try:
            frames, method_used = frame_extractor.extract_frames(
                chunk.path,
                chunk_frames_dir,
                chunk.end_sec - chunk.start_sec,
                scene_threshold=scene_threshold,
                fallback_interval_sec=fallback_interval_sec,
                max_frames=max_frames_per_chunk,
            )
        except Exception as exc:  # noqa: BLE001
            split_result.warnings.append(f"part{chunk.index:03d} のフレーム抽出に失敗: {exc}")
            continue

        for frame in frames:
            ocr_text = ""
            ocr_error = None
            if ocr_ready:
                ocr_result = ocr_analyzer.ocr_image(frame.path, lang=ocr_lang)
                ocr_text = ocr_result.text
                ocr_error = ocr_result.error if not ocr_result.text else None
            all_steps.append(
                manual_builder.Step(
                    step_number=0,  # assigned below, after global sort
                    timestamp_sec=chunk.start_sec + frame.timestamp_sec,
                    chunk_index=chunk.index,
                    frame_path=frame.path,
                    ocr_text=ocr_text,
                    ocr_error=ocr_error,
                )
            )

    all_steps.sort(key=lambda s: s.timestamp_sec)
    for idx, step in enumerate(all_steps, start=1):
        step.step_number = idx

    report(f"{base_name}: マニュアル(HTML)を生成中...", 0.95)

    manual = manual_builder.VideoManual(
        source_name=os.path.basename(input_path),
        duration_sec=info.duration_sec,
        source_size_bytes=info.size_bytes,
        chunks=[
            manual_builder.ChunkSummary(
                index=c.index,
                filename=os.path.basename(c.path),
                size_bytes=c.size_bytes,
                start_sec=c.start_sec,
                end_sec=c.end_sec,
            )
            for c in split_result.chunks
        ],
        steps=all_steps,
        extraction_method=method_used,
        warnings=split_result.warnings,
        ocr_engine_available=ocr_ready,
    )

    manual_path = os.path.join(video_out_dir, f"{base_name}_manual.html")
    manual_builder.save_manual(manual, manual_path)

    report(f"{base_name}: 完了", 1.0)
    return VideoProcessResult(input_path, manual_path, warnings=split_result.warnings)


def process_folder(
    folder: str,
    output_root: str,
    *,
    recursive: bool = False,
    progress_cb: ProgressCallback | None = None,
    **kwargs,
) -> list[VideoProcessResult]:
    ffmpeg_ok, ffprobe_ok = check_ffmpeg_available()
    if not (ffmpeg_ok and ffprobe_ok):
        raise RuntimeError("ffmpeg / ffprobe が見つかりません。インストールしてから再実行してください。")

    videos = find_videos(folder, recursive=recursive)
    if not videos:
        return []

    results = []
    for i, video_path in enumerate(videos):
        if progress_cb:
            progress_cb(
                f"({i + 1}/{len(videos)}) {os.path.basename(video_path)} を処理中...",
                i / len(videos),
            )
        try:
            result = process_video(video_path, output_root, progress_cb=progress_cb, **kwargs)
        except Exception as exc:  # noqa: BLE001 - keep going with the rest of the folder
            result = VideoProcessResult(video_path, None, error=str(exc))
        results.append(result)

    if progress_cb:
        progress_cb("完了", 1.0)
    return results

"""Core processing pipeline for the video -> manual app.

Modules:
    ffmpeg_utils   - thin wrappers around the ffmpeg/ffprobe CLIs
    splitter       - split a video into <= N MB chunks
    frame_extractor- pull representative ("挿画") frames out of a video
    ocr_analyzer   - OCR the extracted frames (Tesseract)
    manual_builder - render an HTML manual from the analysis results
    pipeline       - glue everything together for a whole folder of videos
"""

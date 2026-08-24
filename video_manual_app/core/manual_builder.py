"""Render the analysis results (split chunks + OCR'd frames) as a single,
self-contained HTML manual (screenshots are embedded as base64 so the file
can be copied/shared on its own).
"""
from __future__ import annotations

import base64
import html
import os
from dataclasses import dataclass, field
from datetime import timedelta


def _fmt_time(seconds: float) -> str:
    td = timedelta(seconds=max(0, round(seconds)))
    total = int(td.total_seconds())
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def _fmt_size(num_bytes: int) -> str:
    mb = num_bytes / (1024 * 1024)
    return f"{mb:.1f} MB"


@dataclass
class ChunkSummary:
    index: int
    filename: str
    size_bytes: int
    start_sec: float
    end_sec: float


@dataclass
class Step:
    step_number: int
    timestamp_sec: float
    chunk_index: int
    frame_path: str
    ocr_text: str
    ocr_error: str | None = None


@dataclass
class VideoManual:
    source_name: str
    duration_sec: float
    source_size_bytes: int
    chunks: list[ChunkSummary] = field(default_factory=list)
    steps: list[Step] = field(default_factory=list)
    extraction_method: str = "scene"
    warnings: list[str] = field(default_factory=list)
    ocr_engine_available: bool = True


_CSS = """
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --card-bg: #ffffff;
  --text: #1b1f24;
  --muted: #6b7280;
  --accent: #2563eb;
  --border: #e5e7eb;
  --warn-bg: #fff7ed;
  --warn-border: #fdba74;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Segoe UI", -apple-system, sans-serif;
  line-height: 1.6;
}
header.page-header {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  padding: 24px clamp(16px, 4vw, 48px);
}
h1 { margin: 0 0 8px; font-size: 1.5rem; }
.meta { color: var(--muted); font-size: 0.9rem; }
.meta span { margin-right: 16px; }
main {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px clamp(16px, 4vw, 48px) 64px;
}
.warning-box {
  background: var(--warn-bg);
  border: 1px solid var(--warn-border);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
  font-size: 0.9rem;
}
table.chunk-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 0.9rem;
}
table.chunk-table th, table.chunk-table td {
  text-align: left;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
}
nav.toc {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 20px 0;
}
nav.toc ol { margin: 8px 0 0; padding-left: 20px; }
nav.toc a { color: var(--accent); text-decoration: none; }
nav.toc a:hover { text-decoration: underline; }
.step-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
  margin: 18px 0;
  scroll-margin-top: 16px;
}
.step-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}
.step-badge {
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  padding: 2px 12px;
  font-weight: 600;
  font-size: 0.85rem;
}
.step-time { color: var(--muted); font-size: 0.85rem; }
.step-card img {
  max-width: 100%;
  border-radius: 6px;
  border: 1px solid var(--border);
  display: block;
  margin-bottom: 12px;
}
.ocr-text {
  background: #f9fafb;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  white-space: pre-wrap;
  font-size: 0.92rem;
}
.ocr-empty { color: var(--muted); font-style: italic; }
footer {
  text-align: center;
  color: var(--muted);
  font-size: 0.8rem;
  padding: 24px;
}
"""


def _image_to_data_uri(path: str) -> str:
    with open(path, "rb") as fh:
        data = fh.read()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def build_html_manual(manual: VideoManual) -> str:
    esc = html.escape

    warnings_html = ""
    if not manual.ocr_engine_available:
        warnings_html += (
            '<div class="warning-box">⚠ OCRエンジン(Tesseract)が利用できなかったため、'
            "画面内テキストの抽出はスキップされています。スクリーンショットのみ掲載しています。"
            "Tesseract をインストールすると次回から解析できます。</div>"
        )
    for w in manual.warnings:
        warnings_html += f'<div class="warning-box">⚠ {esc(w)}</div>'

    chunk_rows = "\n".join(
        f"<tr><td>{c.index}</td><td>{esc(c.filename)}</td>"
        f"<td>{_fmt_size(c.size_bytes)}</td>"
        f"<td>{_fmt_time(c.start_sec)} - {_fmt_time(c.end_sec)}</td></tr>"
        for c in manual.chunks
    )

    toc_items = "\n".join(
        f'<li><a href="#step-{s.step_number}">手順 {s.step_number}'
        f" ({_fmt_time(s.timestamp_sec)})</a></li>"
        for s in manual.steps
    )

    step_blocks = []
    for s in manual.steps:
        img_uri = _image_to_data_uri(s.frame_path)
        if s.ocr_error:
            ocr_html = f'<div class="ocr-text ocr-empty">OCRエラー: {esc(s.ocr_error)}</div>'
        elif s.ocr_text:
            ocr_html = f'<div class="ocr-text">{esc(s.ocr_text)}</div>'
        else:
            ocr_html = '<div class="ocr-text ocr-empty">（テキストは検出されませんでした）</div>'

        step_blocks.append(
            f"""
<section class="step-card" id="step-{s.step_number}">
  <div class="step-head">
    <span class="step-badge">手順 {s.step_number}</span>
    <span class="step-time">{_fmt_time(s.timestamp_sec)} / 分割ファイル part{s.chunk_index:03d}</span>
  </div>
  <img src="{img_uri}" alt="手順 {s.step_number} のスクリーンショット" loading="lazy">
  {ocr_html}
</section>"""
        )

    method_label = "シーン変化検出" if manual.extraction_method == "scene" else "一定間隔サンプリング"

    return f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(manual.source_name)} - 操作マニュアル</title>
<style>{_CSS}</style>
</head>
<body>
<header class="page-header">
  <h1>{esc(manual.source_name)} - 操作マニュアル</h1>
  <div class="meta">
    <span>動画長: {_fmt_time(manual.duration_sec)}</span>
    <span>元サイズ: {_fmt_size(manual.source_size_bytes)}</span>
    <span>分割数: {len(manual.chunks)}</span>
    <span>手順数: {len(manual.steps)}</span>
    <span>フレーム抽出方式: {method_label}</span>
  </div>
</header>
<main>
  {warnings_html}
  <h2>分割ファイル一覧（各 30MB 以内）</h2>
  <table class="chunk-table">
    <thead><tr><th>#</th><th>ファイル名</th><th>サイズ</th><th>時間範囲</th></tr></thead>
    <tbody>
    {chunk_rows}
    </tbody>
  </table>

  <nav class="toc">
    <strong>目次</strong>
    <ol>
    {toc_items}
    </ol>
  </nav>

  <h2>手順</h2>
  {''.join(step_blocks)}
</main>
<footer>Generated by video_manual_app</footer>
</body>
</html>
"""


def save_manual(manual: VideoManual, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    html_text = build_html_manual(manual)
    with open(output_path, "w", encoding="utf-8") as fh:
        fh.write(html_text)
    return output_path

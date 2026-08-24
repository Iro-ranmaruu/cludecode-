"""Streamlit app: フォルダ内の動画を 30MB 以内に分割し、挿画(フレーム)を
OCR 解析して、HTML の操作マニュアルを自動生成する。

起動:
    streamlit run app.py
"""
from __future__ import annotations

import os
import sys

import streamlit as st

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import ocr_analyzer, pipeline  # noqa: E402
from core.ffmpeg_utils import check_ffmpeg_available  # noqa: E402

st.set_page_config(page_title="動画マニュアル自動生成", page_icon="🎬", layout="wide")

DEFAULT_OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
# 動画の置き場所（社内共有フォルダ）。環境変数 VIDEO_SOURCE_FOLDER で上書き可能。
DEFAULT_SOURCE_FOLDER = os.environ.get(
    "VIDEO_SOURCE_FOLDER",
    r"\\store\営業企画\企画共有フォルダ\WiSM製品企画販売\temp\飯田保管用\どうがおきば",
)

st.title("🎬 動画 → 分割 & 挿画解析 → マニュアル自動生成")
st.caption(
    "指定フォルダ内の動画を 30MB 以内のファイルに分割し、各パートから代表フレーム（挿画）を"
    "抽出、OCR でテキストを解析して、時系列の HTML マニュアルを作成します。"
)

# --- 環境チェック -----------------------------------------------------------
ffmpeg_ok, ffprobe_ok = check_ffmpeg_available()
ocr_ok = ocr_analyzer.tesseract_available()

status_cols = st.columns(3)
with status_cols[0]:
    st.markdown(f"**ffmpeg**: {'✅ 利用可能' if ffmpeg_ok else '❌ 未検出'}")
with status_cols[1]:
    st.markdown(f"**ffprobe**: {'✅ 利用可能' if ffprobe_ok else '❌ 未検出'}")
with status_cols[2]:
    st.markdown(f"**Tesseract OCR**: {'✅ 利用可能' if ocr_ok else '⚠️ 未検出（画像のみ生成）'}")

if not (ffmpeg_ok and ffprobe_ok):
    st.error(
        "ffmpeg / ffprobe が見つかりません。`sudo apt-get install ffmpeg` などでインストールし、"
        "PATH に通してから再度お試しください。"
    )
if not ocr_ok:
    st.warning(
        "Tesseract が見つからないため、OCR（画面内テキスト抽出）はスキップされます。"
        "`sudo apt-get install tesseract-ocr tesseract-ocr-jpn` を実行すると日本語OCRが有効になります。"
    )

st.divider()

# --- 入力フォーム ------------------------------------------------------------
with st.form("process_form"):
    col1, col2 = st.columns(2)
    with col1:
        folder = st.text_input(
            "動画が入っているフォルダのパス",
            value=DEFAULT_SOURCE_FOLDER,
            placeholder=r"\\store\...\どうがおきば",
            help="Windowsの共有フォルダ(UNCパス)や、マッピング済みのドライブレター（例: Z:\\...）も指定できます。",
        )
        output_dir = st.text_input("出力先フォルダ", value=DEFAULT_OUTPUT)
        recursive = st.checkbox("サブフォルダも対象にする", value=False)
        max_size_mb = st.number_input(
            "分割後の1ファイルあたりの上限サイズ (MB)", min_value=1.0, value=30.0, step=1.0
        )
    with col2:
        target_video_kbps = st.slider(
            "目標映像ビットレート (kbps)", min_value=300, max_value=4000, value=1200, step=100
        )
        scene_threshold = st.slider(
            "シーン変化検出のしきい値（低いほど多くのフレームを抽出）",
            min_value=0.05,
            max_value=0.9,
            value=0.35,
            step=0.05,
        )
        fallback_interval_sec = st.number_input(
            "シーン変化が少ない場合のフォールバック間隔（秒）",
            min_value=1.0,
            value=15.0,
            step=1.0,
        )
        ocr_lang = st.selectbox("OCR言語", options=["jpn+eng", "jpn", "eng"], index=0)

    submitted = st.form_submit_button("🚀 処理開始", use_container_width=True)

if "results" not in st.session_state:
    st.session_state["results"] = None

if submitted:
    if not folder or not os.path.isdir(folder):
        st.error("有効なフォルダパスを指定してください。")
    elif not (ffmpeg_ok and ffprobe_ok):
        st.error("ffmpeg が利用できないため処理を開始できません。")
    else:
        videos = pipeline.find_videos(folder, recursive=recursive)
        if not videos:
            st.warning("指定フォルダに動画ファイルが見つかりませんでした。")
        else:
            st.info(f"{len(videos)} 件の動画を処理します。")
            progress_bar = st.progress(0.0)
            status_text = st.empty()

            def progress_cb(message: str, frac: float | None) -> None:
                status_text.write(message)
                if frac is not None:
                    progress_bar.progress(min(max(frac, 0.0), 1.0))

            with st.spinner("処理中... (動画の長さ・本数により数分かかることがあります)"):
                results = pipeline.process_folder(
                    folder,
                    output_dir,
                    recursive=recursive,
                    max_size_mb=max_size_mb,
                    target_video_kbps=int(target_video_kbps),
                    scene_threshold=scene_threshold,
                    fallback_interval_sec=fallback_interval_sec,
                    ocr_lang=ocr_lang,
                    progress_cb=progress_cb,
                )
            st.session_state["results"] = results
            progress_bar.progress(1.0)
            status_text.write("完了しました。")

# --- 結果表示 ---------------------------------------------------------------
results = st.session_state.get("results")
if results:
    st.divider()
    st.header("結果")
    ok_count = sum(1 for r in results if r.manual_path)
    st.write(f"成功: {ok_count} / {len(results)} 件")

    for r in results:
        name = os.path.basename(r.source_path)
        with st.expander(name, expanded=(r.error is not None)):
            if r.error:
                st.error(r.error)
                continue
            st.success(f"マニュアルを生成しました: {r.manual_path}")
            for w in r.warnings:
                st.warning(w)

            if r.manual_path and os.path.exists(r.manual_path):
                with open(r.manual_path, "r", encoding="utf-8") as fh:
                    html_content = fh.read()
                st.download_button(
                    "📄 マニュアル(HTML)をダウンロード",
                    data=html_content,
                    file_name=os.path.basename(r.manual_path),
                    mime="text/html",
                    key=f"dl_{r.manual_path}",
                )
                st.components.v1.html(html_content, height=800, scrolling=True)
else:
    st.caption("フォルダを指定して「処理開始」を押してください。")

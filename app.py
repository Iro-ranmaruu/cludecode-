import os
import base64
import io
import anthropic
import pdfplumber
import docx
from flask import Flask, request, jsonify, render_template, stream_with_context, Response
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB

ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(file_bytes):
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


def extract_text_from_docx(file_bytes):
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(para.text for para in doc.paragraphs)


SYSTEM_PROMPT = """あなたは議事録の専門的なアナリストです。
提供された議事録を分析し、以下の構造で日本語で要約してください：

## 📋 会議概要
- 日時・場所・参加者（記載があれば）

## 🎯 主要議題
- 話し合われた主なトピックを箇条書きで

## ✅ 決定事項
- 会議で決定された事項を箇条書きで

## 📌 アクションアイテム
- 誰が・何を・いつまでに行うかを整理

## 💡 重要ポイント
- 特に注目すべき点や背景情報

## 📝 次回への申し送り
- 次回会議で継続して議論すべき事項（あれば）

情報が不明な項目は「記載なし」と記載してください。"""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/summarize", methods=["POST"])
def summarize():
    if "file" not in request.files:
        return jsonify({"error": "ファイルが選択されていません"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "ファイルが選択されていません"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "対応していないファイル形式です。TXT、PDF、DOCXのみ対応しています"}), 400

    filename = secure_filename(file.filename)
    file_bytes = file.read()
    ext = filename.rsplit(".", 1)[1].lower()

    try:
        if ext == "txt":
            text = file_bytes.decode("utf-8", errors="replace")
            content = [
                {"type": "text", "text": f"以下の議事録を要約してください：\n\n{text}"}
            ]
        elif ext == "pdf":
            pdf_base64 = base64.standard_b64encode(file_bytes).decode("utf-8")
            content = [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_base64,
                    },
                },
                {"type": "text", "text": "この議事録を要約してください。"},
            ]
        elif ext == "docx":
            text = extract_text_from_docx(file_bytes)
            content = [
                {"type": "text", "text": f"以下の議事録を要約してください：\n\n{text}"}
            ]
        else:
            return jsonify({"error": "対応していないファイル形式です"}), 400
    except Exception as e:
        return jsonify({"error": f"ファイルの読み込みに失敗しました: {str(e)}"}), 500

    def generate():
        try:
            with client.messages.stream(
                model="claude-opus-4-8",
                max_tokens=4096,
                thinking={"type": "adaptive"},
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": content}],
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {text}\n\n"
            yield "data: [DONE]\n\n"
        except anthropic.APIError as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

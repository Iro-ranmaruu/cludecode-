"""OCR the extracted frames using Tesseract (fully local, no network calls).

Requires the `tesseract` binary to be installed on the system, plus the
language data for whatever `lang` is requested (Japanese: `jpn`,
`tesseract-ocr-jpn` / `tesseract-ocr-jpn-vert` package on most distros).
"""
from __future__ import annotations

import shutil
from dataclasses import dataclass

try:
    import pytesseract
    from PIL import Image

    _IMPORT_ERROR: Exception | None = None
except Exception as exc:  # pragma: no cover - import-time environment issue
    pytesseract = None  # type: ignore[assignment]
    Image = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc


@dataclass
class OcrResult:
    text: str
    engine_available: bool
    error: str | None = None


def tesseract_available() -> bool:
    return shutil.which("tesseract") is not None and _IMPORT_ERROR is None


def available_languages() -> list[str]:
    if not tesseract_available():
        return []
    try:
        return list(pytesseract.get_languages(config=""))
    except Exception:
        return []


def ocr_image(path: str, *, lang: str = "jpn+eng") -> OcrResult:
    if _IMPORT_ERROR is not None:
        return OcrResult(
            text="",
            engine_available=False,
            error=f"pytesseract/Pillow が読み込めません: {_IMPORT_ERROR}",
        )
    if not shutil.which("tesseract"):
        return OcrResult(
            text="",
            engine_available=False,
            error="tesseract バイナリが見つかりません。インストールしてください。",
        )

    effective_lang = lang
    langs_installed = available_languages()
    if langs_installed:
        requested = [l for l in lang.split("+") if l in langs_installed]
        if not requested:
            effective_lang = "eng" if "eng" in langs_installed else langs_installed[0]
        else:
            effective_lang = "+".join(requested)

    try:
        with Image.open(path) as img:
            text = pytesseract.image_to_string(img, lang=effective_lang)
        return OcrResult(text=text.strip(), engine_available=True)
    except Exception as exc:  # noqa: BLE001 - surface any OCR failure per-frame
        return OcrResult(text="", engine_available=True, error=str(exc))

---
name: naiken
description: 賃貸の内見チェックリスト「内見チェック帳」を開く。ユーザーが「内見チェック」「チェックリスト」「内見」と言ったとき、または /naiken を入力したときに使う。
---

# 内見チェック帳を開く

1. Artifact ツールで `action: "open"`、`url: "https://claude.ai/artifact/TUpudQCZQG4aZM4MFpAZdt"` を呼び出して、ページを開く。
2. 次のように短く返す（リンクも必ず載せる）。

内見チェック帳です。物件ごとに◯△✕、メモ（文字・音声）、写真を残せます。
https://claude.ai/artifact/TUpudQCZQG4aZM4MFpAZdt

ページの中身を作り直したり書き換えたりはしない。ユーザーが変更を頼んだときだけ、`naiken-checklist.html` を編集して同じファイルパスで再公開する。

---
name: hiyou
description: 賃貸の2年間コスト試算表「2年住んだらいくら？」を開く。ユーザーが「費用試算」「コスト試算」「初期費用」「家賃比較」と言ったとき、または /hiyou を入力したときに使う。
---

# コスト試算表を開く

1. Artifact ツールで `action: "open"`、`url: "https://claude.ai/artifact/RUQVtrpDLSBBuRfwQWU2Hy"` を呼び出して、ページを開く。
2. 次のように短く返す（リンクも必ず載せる）。

2年間のコスト試算表です。物件ごとに初期費用と家賃を入れると、2年間の総額を安い順に比べられます。
https://claude.ai/artifact/RUQVtrpDLSBBuRfwQWU2Hy

ページの中身を作り直したり書き換えたりはしない。ユーザーが変更を頼んだときだけ、`rent-cost-compare.html` を編集して同じファイルパスで再公開する。

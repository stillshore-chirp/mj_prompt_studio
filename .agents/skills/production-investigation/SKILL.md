---
name: production-investigation
description: "配布artifact、インストール済みアプリ、実OpenAI API、SQLite・asset store・OS資格情報ストア、GitHub Actionsの実挙動を、観測証跡とコード上の仮説を分離して調査する時に使う。"
---

# 実環境調査 Skill

## 発動条件

配布package、インストール済みMJ Prompt Studio、実OpenAI API、SQLite/local DB、local asset store、OS keyring、またはGitHub Actions・package/releaseの実挙動を調べるときに使います。コード・mock・静的テストだけの調査には、実環境の結論を付けません。

## 調査開始

最初に対象、目的、期待値、時間範囲、OS・version・commit、権限、network、data boundary、出力artifact、破棄条件を固定します。read-only観測を先に行い、対象path、実行条件、snapshot、exit code、時刻を記録します。対象の取り違え、古いpackage、別DB、別keyring、別API projectを混ぜません。

## 観測範囲

- package/release: build input、commit、依存、署名、同梱物、起動条件、実行時設定、配布artifactの差分を確認する。
- installed app: 実際のbundle・設定・権限・startup・localhost API接続・ログ・保存先を確認する。source checkoutの挙動をインストール済みの証拠にしない。
- OpenAI API: 明示的に許可された実環境だけで、model、固定policy、Privacy mode、request/result、失敗分類、retry、continuationの扱いを確認する。API key、prompt、response、画像、識別子は記録・公開しない。
- SQLite/local DB: schema、migration、transaction、record、参照整合性、lock、backup、実データと期待状態を確認する。内容の持ち出しは最小限にする。
- asset store: local reference/生成assetの境界、known-ID access、存在・参照・削除・権限を確認し、実画像や追跡可能なpathを証跡に含めない。
- OS keyring/credential store: 利用可否、service名、scope、失敗理由だけを確認し、secret valueは読まない・出さない。
- GitHub Actions/package: workflow run、HEAD、check、artifact、実行条件、失敗ログを確認し、未取得のjobを成功と推測しない。

## 事実と仮説

報告を「観測事実」「コードからの仮説」「未確認」に分けます。再現条件、観測時刻、対象revision、証跡artifactを結び、症状、境界、原因候補、反証、次の最小確認を分けて書きます。静的契約は実API順序、desktop scheduler、インストール状態、production logの証明ではありません。

## 安全・終了

通常テスト・CIから実OpenAI APIを呼ばず、mock/fake/contract testを使います。Midjourney web/Discord/browser、Cookie、Token、非公式APIを自動操作しません。DB変更、asset変更、keyring更新、package再生成、release、公開、secret rotationは別の明示指示と対象確認が必要です。

最終報告には、対象snapshot、観測コマンド・条件、fact、hypothesis、unperformed checks、artifact reference、影響、残るriskを含めます。prompt、参照画像、生成画像、local DB、secret、raw log、個人情報、追跡可能なIDや絶対pathを報告へ残しません。

# Issue #16: 画像追加のキーボード操作

- Issue: [#16](https://github.com/stillshore-chirp/mj_prompt_studio/issues/16)
- 分類: UI/UX / アクセシビリティ / 状態・エラー・待機
- 目的: 参照素材と結果画像をマウス、キーボード、支援技術のいずれでも追加できるようにする。
- 非目標: upload endpointとasset storeの変更。

## 受け入れ条件

- [x] Add/Importがkeyboardで到達・実行できる。
- [x] control名が対象と結果を示す。
- [x] 対応形式・失敗・送信対象が理解できる。
- [x] drag & dropなしでも同等の追加フローを完了できる。

## 検証

- `make client-lint && make client-typecheck && make client-test && make client-build`
- 隔離Playwright 10件、`git diff --check`、`bash scripts/verify-ai-governance.sh`

## 状態・リスク

- 非画像の選択・drop時はローカルで理由を表示し、APIには送らない。
- 標準E2E portは既存プロセスを停止せず、隔離portとCIで代替する。

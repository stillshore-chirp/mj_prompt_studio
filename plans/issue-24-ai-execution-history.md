# Issue #24: 現在のAI実行構成と履歴値を区別する

## 目的

AI Inspectorで、固定の現在のAI実行構成と、PromptDocumentに保存された過去の実行履歴を混同させない。

## 非目標

- 固定LLM実行ポリシー、保存済み履歴、継続可否の判定を変更しない。
- 過去の保存値を削除・改竄しない。

## 対象範囲

- AI Inspectorの見出し、現在構成、履歴表示、legacy時の説明。
- 現在構成と異なる履歴を含むcomponent/API回帰テスト。
- UI/UX証跡と安全な前後スクリーンショット。

## マイルストーン

- [x] Issue受け入れ条件と既存の固定ポリシー・継続判定を確認する。
- [ ] 現在構成と履歴を分離して表示する。
- [ ] legacy/currentの回帰テストとUI/UX証跡を追加する。
- [ ] ローカル検証、PR、CI、レビュー、マージ後main CIを完了する。

## 受け入れ条件

- 現在の実行構成と履歴値を混同しない。
- 過去の保存値がある場合、履歴であることと影響を説明する。
- 固定構成を変更可能に見せない。

## 検証

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知のリスク

- UIの表示変更のみで履歴値自体は保存・移行しない。実際の継続可否は既存のサーバー側固定ポリシー判定に委ねる。

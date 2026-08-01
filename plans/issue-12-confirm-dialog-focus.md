# Issue #12: 確認ダイアログの安全なkeyboard操作

## Issue

- Issue: [#12](https://github.com/stillshore-chirp/mj_prompt_studio/issues/12)

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / 状態・エラー・待機

## 目的

Patch適用、参照削除、手動コピーの確認ダイアログを、キーボードと支援技術で安全に完了または取消できる状態にする。

## 非目標

- ダイアログ以外の全keyboard shortcutやnested dialogの導入。
- Patch・削除・コピー処理のAPI契約変更。

## 対象範囲

- 共通`ConfirmDialog`の初期focus、focus trap、Esc、return focus、背景inert、ARIA説明。
- Patch、削除、Manual Copyを対象にした具体的な確認copyと回帰test。

## マイルストーン

- [x] Issueの事実・受け入れ条件と既存実装を確認
- [x] dialogのkeyboard・focus・ARIAを実装
- [x] Patch、削除、Manual Copyのcomponent testを追加
- [x] UI/UX state matrix・前後証跡・反証レビューを記録
- [ ] ローカル検証、PR、CI、review、mainへのマージを完了

## 受け入れ条件

- [ ] 開くと安全な最初のcontrolへfocusする。
- [ ] Tab/Shift+Tabはdialog内で循環する。
- [ ] Escとキャンセルで閉じ、呼び出し元へfocusが戻る。
- [ ] 背景は操作・支援技術の対象にならない。
- [ ] dialogの目的と影響が読み上げられる。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`

## 既知 blocker

- ローカル常駐serverが標準E2E portを使用している場合は、利用者processを停止せず、隔離検証またはCIで代替する。

## 仮定・未確認事項

- 単一dialogだけが開く既存状態管理を維持し、確認を開いた起点へ閉じた後にfocusを戻す。

## UI/UX 証跡

- state matrix、初見理解、a11y、反証レビュー: `docs/ai-governance/reports/issue-12-confirm-dialog-focus.md`
- 変更前/変更後screenshot: PR本文に、安全なfixtureを使用して添付する。

## feature flag / rollback

- 変更は通常のgit revertで戻せる単位にまとめる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-01 | `make client-lint` / `make client-typecheck` / `make client-test` / `make client-build` | Pass | 15 tests passed、型・lint・production build成功 |
| 2026-08-01 | `make lint` / `make typecheck` / `make test` / `make build` / `make verify-governance` | Pass | Python test 44 passed、governance verification成功 |
| 2026-08-01 | 隔離mock Playwright E2E | Pass | 自動提案、確認dialog、既存core workflowの3 tests passed |
| 2026-08-01 | `make e2e` | 未実行 | 利用中のlocal serverが標準port 8765を使用中。停止せず、別port・新規mockデータの同等E2Eで代替 |

## PR / CI / review 記録

- Branch: `codex/fix-confirm-dialog-focus`
- Commit: 未作成
- PR: 未作成
- Push CI: 未実行
- PR CI: 未実行
- Codex review: 未実行
- 未解決 review thread: 未確認
- レビュー往復回数: 0

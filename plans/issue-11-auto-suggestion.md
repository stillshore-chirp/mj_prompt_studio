# Issue #11: Composerの自動提案ジョブ連鎖を停止する

## Issue

- Issue: [#11](https://github.com/stillshore-chirp/mj_prompt_studio/issues/11)

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / 状態・エラー・待機

## 目的

Composerで利用者が実際に編集した入力だけを、1回の待機後にAI補助へ送信する。再描画、Job完了、親callbackの再生成だけでは新しいJobを作成しない。

## 非目標

- AI提案を既存の確認フローを迂回して自動適用しない。
- 実OpenAI APIの呼び出し、LLM実行ポリシー、他画面のJob UXは変更しない。

## 対象範囲

- Composerの入力revision・debounce・送信防止
- 最新revisionに紐づく提案だけを表示する状態管理
- 利用者に送信時機と提案の扱いを示すstatus copy
- component / application test、UI/UX証跡、変更前後screenshot

## マイルストーン

- [x] 原因、影響、再現条件をIssue #11へ記録
- [x] ComposerとAppの送信・完了処理をrevision単位で保護
- [x] component / application testを追加し、回帰を防止
- [x] state matrix・アクセシビリティ・反証レビューを記録
- [x] ローカル検証、PR、CI、reviewを完了
- [ ] mainへのマージを完了

## 受け入れ条件

- [x] 同じ入力revisionで、debounce後に作成される自動提案Jobは1件だけである。
- [x] Job完了や親componentの再描画だけでは、追加の自動提案Jobを作成しない。
- [x] 新しい編集後は新しいrevisionとして1件だけ送信でき、古い結果は提案として表示しない。
- [x] 初期表示だけでは自動送信しない。
- [x] 待機・送信・完了・失敗の状態と「提案は自動適用しない」ことを利用者が把握できる。
- [x] keyboard、読み上げstatus、既存保存・Compile導線を損なわない。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`

## 既知 blocker

- ローカル常駐serverがE2E標準portを使用している場合は、利用者のprocessを停止せず、隔離した検証環境またはCIで確認する。

## 仮定・未確認事項

- 自動提案は、利用者が入力を止めた後に送る既存の支援機能として維持する。新規の自動送信は明示copyで通知し、提案の適用は既存の確認操作に留める。

## UI/UX 証跡

- state matrix、初見理解、a11y、反証レビュー: `docs/ai-governance/reports/issue-11-auto-suggestion.md`
- 変更前/変更後screenshot: PR本文に、安全なfixtureを使用して添付する。

## feature flag / rollback

- 変更は通常のgit revertで戻せる単位にまとめる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-01 | client unit / typecheck / lint | Pass | 11 tests passed、型・lint成功 |
| 2026-08-01 | Python lint / typecheck / test / build | Pass | 44 tests passed |
| 2026-08-01 | client build | Pass | production build成功 |
| 2026-08-01 | 隔離mock Playwright E2E | Pass | 自動提案回帰と既存core workflow 2 tests passed。標準E2Eは既存local serverの使用中portにより未実行 |

## PR / CI / review 記録

- Branch: `codex/fix-auto-suggestion-loop`
- Commit: `8238a7c205b8f55d2c455bdfb4fe32278edfa620`
- PR: [#30](https://github.com/stillshore-chirp/mj_prompt_studio/pull/30)
- Push CI: 4 / 4 success
- PR CI: 3 / 3 success
- Codex review: 差分・状態遷移・回帰test・視覚証跡を確認。新規P0/P1/P2なし
- 未解決 review thread: 0（GraphQL確認）
- レビュー往復回数: 0

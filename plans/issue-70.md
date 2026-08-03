# Issue #70 mock→real会話継続境界

## Issue

- Issue: `#70`

## タスク分類

- backend / LLM変更、およびユーザーが見る失敗・回復結果に影響するUI/UX変更
- UI表示、文言、操作、レイアウト自体の変更はなし

## 目的

mock由来または由来不明の会話継続IDをreal OpenAI APIへ送らず、同じPromptDocumentを入力保持したまま新規応答として安全に実行できるようにする。

## 非目標

- 固定モデル、reasoning effort、text verbosity、Structured Outputs schemaの変更
- UI文言、レイアウト、操作導線の変更
- 通常CIから実OpenAI APIを呼ぶこと
- 保存済みユーザー入力、response ID、provider応答原文の公開

## 対象範囲

- `PromptWorkflowService`の継続ID選択
- mock→real、real→real、由来不明→real、旧モデル境界の回帰test
- UI/UX状態・回復・信頼性レビュー記録
- LLM継続境界に関する関連文書

## マイルストーン

- [x] Task 1: mock→realの失敗条件を回帰testで固定する。
- [x] Task 2: target backendと保存済みbackendを照合して継続IDを選択する。
- [x] Task 3: 関連docsとUI/UX証跡を更新する。
- [x] Task 4: lint、typecheck、test、build、公開安全性を検証する。
- [ ] Task 5: 日本語commit、push、Ready PR、push/PR CI、Codex review、review thread確認を完了する。

## 受け入れ条件

- [x] 現行固定モデルかつOpenAI backend由来のIDだけがreal APIへ渡される。
- [x] mock由来または由来不明のIDはreal APIへ渡されない。
- [x] mock mode内の既存動作とPrivacy modeを不必要に変更しない。
- [x] 同一モデルのmock→real切替を再現する回帰testがある。
- [x] 入力、API key、response ID、provider応答原文を新たに公開・log保存しない。
- [x] UI表示変更がなく、既存の待機・成功・失敗・回復表示契約を保持する。

## 検証コマンド

- `make lint`
- `make typecheck`
- `make test`
- `make build`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知 blocker

- 実API smokeは通常CIの対象外。providerが示した不正parameter名はprovider応答原文を保持していないため未確認。

## 仮定・未確認事項

- safe diagnostics、code、保存済みID種別からmock由来 `previous_response_id` が直接原因である可能性が高いと判断する。
- backend由来がない旧データは継続を捨てて新規応答にする方が、不正ID送信より安全である。

## UI/UX 証跡

- `docs/ai-governance/reports/issue-70-mock-real-continuation.md`
- UI描画、文言、DOM、accessibility treeの変更なし。前後screenshotは対象外とし、state matrixと回帰testを証跡にする。

## feature flag / rollback

- feature flagなし。変更は通常のgit revertで戻せる。
- rollbackするとmock由来IDがreal APIへ送られる不具合が再発するため、保存済みmock IDのない環境に限定する。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-03 | 修正前 `make test` | Fail（92 pass / 4 fail） | backend境界testが未実装を検出 |
| 2026-08-03 | `make lint` | Pass | Ruff |
| 2026-08-03 | `make typecheck` | Pass | mypy 54 source files |
| 2026-08-03 | `make test` | Pass | 97 tests、既存deprecation warning 1件 |
| 2026-08-03 | `make build` | Pass | Python compileall |
| 2026-08-03 | `make client-lint` | Pass | UI source変更なし |
| 2026-08-03 | `make client-typecheck` | Pass | UI source変更なし |
| 2026-08-03 | `make client-test` | Pass | 15 files / 62 tests |
| 2026-08-03 | `make client-build` | Pass | production build |
| 2026-08-03 | `git diff --check` | Pass | whitespace errorなし |
| 2026-08-03 | `bash scripts/verify-ai-governance.sh` | Pass | governance整合 |

## PR / CI / review 記録

- Branch: `codex/issue-70-mock-real-continuation`
- Commit:
- PR:
- Push CI:
- PR CI:
- Codex review:
- 未解決 review thread:
- レビュー往復回数: 0

# Issue #13: 起動とJobの状態・失敗・回復feedback

## Issue

- Issue: [#13](https://github.com/stillshore-chirp/mj_prompt_studio/issues/13)

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / 状態・エラー・待機

## 目的

起動とJobの待機・実行・成功・失敗・取消を正確かつ安全に示し、利用者が再試行、取消、設定確認など次の行動を選べるようにする。

## 非目標

- Job queueの並列実行方針、LLM実行ポリシー、API契約の変更。
- 実APIの詳細・内部error・logをユーザー可視領域へ出すこと。

## 対象範囲

- boot/loading/error/retryと接続設定確認の回復画面。
- footer statusのlive regionと状態別の視覚表現。
- Job行のqueued/running/succeeded/failed/cancelled表示、失敗の安全な説明、cancel/retry操作。
- boot failure、job failure/cancelledのcomponent/E2E回帰test。

## マイルストーン

- [x] Issueの事実・受け入れ条件と既存起動・Jobs実装を確認
- [x] boot/job statusと安全なerror正規化を実装
- [x] failure/cancelledとlive regionの回帰testを追加
- [x] UI/UX state matrix・前後証跡・反証レビューを記録
- [x] ローカル検証、PR、CI、review、mainへのマージを完了

## 受け入れ条件

- [x] 起動失敗で原因種別、再試行、設定確認への導線を示す。
- [x] queued/running/succeeded/failed/cancelledを区別する。
- [x] errorは原因、影響、回復手段を読み上げ可能な形で示す。
- [x] success色をerror/待機へ流用しない。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`

## 既知 blocker

- ローカル常駐serverが標準E2E portを使用している場合は、利用者processを停止せず、隔離検証またはCIで代替する。

## 仮定・未確認事項

- backendが返すerror detailは公開せず、HTTP/network/schema種別とJob状態から安全な回復copyへ正規化する。

## UI/UX 証跡

- state matrix、初見理解、a11y、反証レビュー: `docs/ai-governance/reports/issue-13-boot-job-feedback.md`
- 変更前/変更後screenshot: PR本文に、安全なfixtureを使用して添付する。

## feature flag / rollback

- 変更は通常のgit revertで戻せる単位にまとめる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-01 | `make client-lint && make client-typecheck && make client-test && make client-build` | Pass | ESLint、TypeScript、Vitest 7 files / 18 tests、production build |
| 2026-08-01 | `npx playwright test --config .tmp/issue-13-e2e.config.ts` | Pass | 隔離port 5773/9376で5 E2E。boot HTTP failure、Job failure、既存回帰を確認 |
| 2026-08-01 | `npx playwright test --config .tmp/issue-13-visual.config.ts` | Pass | 安全なfixtureでboot recoveryとfailed Jobの画面証跡を取得 |
| 2026-08-01 | `make lint && make typecheck && make test && make build && make verify-governance` | Pass | Ruff、mypy、pytest 44 tests、compileall、governance |
| 2026-08-01 | `make e2e` | 代替済み | sandboxではbind不可、権限付き再実行では利用中の127.0.0.1:8765を検出。既存processを停止せず、隔離E2Eを実行 |

## PR / CI / review 記録

- Branch: `codex/fix-boot-job-feedback`
- Commit: `68cb874`（起動とJobの状態フィードバックを改善する）
- PR: [#32](https://github.com/stillshore-chirp/mj_prompt_studio/pull/32) — 2026-08-01にmainへマージ（`266c428`）
- Push CI: 成功（CI 3 jobs）
- PR CI: 成功（CI 3 jobs）
- main CI: 成功（CI 3 jobs）
- Codex review: 独立CLI reviewは3経路で内部runtime errorにより結論を返せなかった。current agentの差分・state matrix・E2E・画面証跡の反証確認ではP0/P1なし。
- GitHub review / 未解決 review thread: 0件 / 0件（GraphQL `reviewThreads`で確認）
- レビュー往復回数: 0

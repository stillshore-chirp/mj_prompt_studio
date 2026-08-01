## Issue

- Issue: [#28](https://github.com/stillshore-chirp/mj_prompt_studio/issues/28)

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / コピー / 状態・エラー・待機

## 目的

成功履歴が増えても、反復利用者が対応中・失敗・取消済みのAI処理をすぐ見つけ、対象と安全な復帰手段を判断できるようにする。

## 非目標

- Jobの永続保持期間、キュー実行順、再試行API、保存データの変更
- backendから返す生の例外・機微な入力内容の表示

## 対象範囲

- Jobs footerの優先順位、status filter、完了履歴の段階的開示、詳細展開
- keyboard/a11y、unit/E2E、UI/UX証跡

## マイルストーン

- [x] Issue・既存Job契約・UI/UXガバナンスを確認する。
- [x] 表示モデル・state matrix・反証観点を決める。
- [x] JobsPanelとunit/E2Eを実装する。
- [ ] 前後スクリーンショット、PR/CI/reviewを完了する。

## 受け入れ条件

- [x] running/failed/cancelledを成功履歴より優先して見つけられる。
- [x] 失敗理由、対象、retry/cancelが必要時に確認できる。
- [x] 多数の成功履歴が主要作業を覆わない。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make e2e`
- `make client-build`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知 blocker

- なし

## 仮定・未確認事項

- Jobの入力snapshotは公開APIでredact済みである。表示する対象はsnapshotの値ではなく、ユーザー向けAgent名と対象種別へ限定する。

## UI/UX 証跡

- report: `docs/ai-governance/reports/issue-28-improve-job-recovery.md`
- 変更前/後: 安全なmockデータで撮影し、PR本文へ添付する。
- state matrix: 上記reportに記録する。

## feature flag / rollback

- 表示層だけの変更であり、通常のgit revertで戻せる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `make client-lint` | Pass | ESLint成功 |
| 2026-08-02 | `make client-typecheck` | Pass | TypeScript型検査成功 |
| 2026-08-02 | `make client-test` | Pass | 14 files、36 tests成功 |
| 2026-08-02 | `make e2e` | Pass | Playwright 19 tests成功。keyboard filter、狭幅、文字拡大を含む |
| 2026-08-02 | `make client-build` | Pass | production build成功 |
| 2026-08-02 | `git diff --check` | Pass | whitespace errorなし |
| 2026-08-02 | `bash scripts/verify-ai-governance.sh` | Pass | ガバナンス検査成功 |

## PR / CI / review 記録

- Branch: `codex/improve-job-recovery`
- Commit:
- PR:
- Push CI:
- PR CI:
- Codex review:
- 未解決 review thread:
- レビュー往復回数:

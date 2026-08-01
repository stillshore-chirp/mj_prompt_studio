# Issue #22: プライバシーを守るUI/UXユーザー検証計画

## Issue

- Issue: `#22`

## タスク分類

- 文書のみ / UI/UX / プライバシー

## 目的

ユーザー資産や個人情報を集めずに、主要workflowの理解・効率・信頼を検証する反復可能な手順を定める。

## 非目標

- telemetry、外部分析基盤、同意なしの送信、prompt・画像・API key・個人情報の収集。
- 実ユーザーテストを実施したと主張すること。

## 対象範囲

- task、仮説、観測指標、成功基準、停止条件
- 任意・ローカル優先の手動評価、同意、削除、保存先
- 未計測P2仮説の優先順位

## マイルストーン

- [x] 安全なユーザー検証計画を文書化する。
- [x] 既存security/privacy方針との整合を確認する。
- [ ] 文書検証、PR/CI/reviewを完了する。

## 受け入れ条件

- [x] 対象task、仮説、測定方法、成功基準、停止条件を文書化する。
- [x] 収集対象・保存先・同意・削除方針を明確にする。
- [x] 計測なしでも実行可能な質的評価手順を示す。

## 検証コマンド

- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知 blocker

- 実ユーザー参加者は本Issueの完了条件ではない。未実施のまま結果を作らない。

## 仮定・未確認事項

- 評価はアプリ利用者の任意参加で、実制作物を用いず安全なfixtureまたは参加者がその場で作る非機微な例を使う。

## UI/UX 証跡

- `docs/ux-research-plan.md` に対象task、state、quality gate、反証を記録する。
- UI変更なしのためscreenshotはN/A。

## feature flag / rollback

- コード・telemetry・保存形式は追加しない。文書は通常のgit revertで戻せる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `git diff --check && bash scripts/verify-ai-governance.sh` | Pass | 文書のwhitespace / governance確認 |

## PR / CI / review 記録

- Branch: `codex/improve-privacy-feedback`
- Commit: 未作成
- PR: 未作成
- Push CI: 未実行
- PR CI: 未実行
- Codex review: 手動文書レビュー済み。PR後に再確認する。
- 未解決 review thread: PR後に確認する。
- レビュー往復回数: 0

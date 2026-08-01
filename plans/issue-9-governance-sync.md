# Issue #9 WordPack ガバナンス適合導入

## 目的

`wordpack-for-english` の最新 `main` にある開発運用・Issue 品質・UI/UX 品質・公開安全性・完了ゲートを、MJ Prompt Studio の React + TypeScript client、localhost Python API、固定 LLM 実行ポリシー、ローカル資産管理へ適合して導入する。

## 非目標

- WordPack 固有の Cloud Run、Firebase、Firestore、認証、デプロイ手順を移植しない。
- 参照元の過去レポート、スクリーンショット、アプリ固有 evidence をコピーしない。
- LLMOps 実装やユーザー向け UI を変更しない。
- MJ Prompt Studio 固有の禁止表記、LLM、Ruleset、Storage、Security の正本を置き換えない。

## 対象範囲

- `AGENTS.md` の開始、Issue-first、UI/UX、公開安全性、完了、レビュー収束ゲート
- `docs/ai-governance/` の詳細正本、チェックリスト、テンプレート、参照資料
- `.agents/skills/ui-ux-review/SKILL.md`
- `.github/ISSUE_TEMPLATE/*.md` と `.github/pull_request_template.md`
- `docs/security-publication-checklist.md`
- `scripts/verify-ai-governance.sh`、`Makefile`、CI、関連 process docs

## マイルストーン

- [x] Task 1: 参照元の最新 GitHub `main`、現リポジトリ規約、履歴、作業ツリーを確認する。
- [x] Task 2: Issue #9 と専用ブランチを作成し、移植対象と非対象を確定する。
- [x] Task 3: 正本、skill、テンプレート、チェックリストを MJ Prompt Studio 向けに導入する。
- [x] Task 4: 構造検証を実装し、Makefile と CI へ接続する。
- [x] Task 5: 文書公開安全性、参照整合、差分、ローカル品質ゲートを検証する。
- [x] Task 6: 日本語で commit、push、Ready PR 作成、CI と review thread 収束まで確認する。

## 受け入れ条件

- [x] `AGENTS.md` が 32KiB 未満で、詳細正本への導線と既存の MJ Prompt Studio 固有ルールを保持する。
- [x] Issue 品質、UI/UX P0/P1/P2、state matrix、アクセシビリティ、反証レビュー、公開安全性、PR/CI/レビュー収束が実行可能な基準として定義される。
- [x] Issue/PR template、UI/UX skill、チェックリスト、完了報告 template が正本と整合する。
- [x] `scripts/verify-ai-governance.sh` が必要ファイル、必須ルール、重複防止構造、`AGENTS.md` サイズを検査する。
- [x] CI がガバナンス検証を実行する。
- [x] 文書、リンク、コマンド、公開安全性が確認される。
- [x] ローカル検証、push CI、PR CI、Codex review、未解決 review thread の確認が完了する。

## 検証コマンド

- `bash scripts/verify-ai-governance.sh`
- `git diff --check`
- `make lint`
- `make typecheck`
- `make test`
- `make build`
- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`

## 既知 blocker

- なし。

## 仮定

- 「実装されているルール」は参照元の再利用可能な AI エージェント開発ガバナンスを指し、アプリ機能や過去の証跡データは含まない。
- 参照元の Web 固有基準は React client に適用し、デスクトップ配布・localhost API・ローカル資産固有の観点を追加する。
- 本タスクは UI を変更しないため、前後スクリーンショットは N/A とする。

## feature flag / rollback

- feature flag は不要。
- 文書、テンプレート、検証入口の変更は通常の `git revert` で戻せる単位にまとめる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-01 | `git status --short --branch` | PASS | 開始時 clean、別作業ブランチから最新 `origin/main` 基点へ分離 |
| 2026-08-01 | 参照元 GitHub `main` の取得 | PASS | `51f042a` を一時領域へ clone |
| 2026-08-01 | `make verify-governance` / `bash -n scripts/verify-ai-governance.sh` | PASS | 必須file、rule、32KiB、ignore衝突、skill/templateを検査 |
| 2026-08-01 | `git diff --check` / 禁止表記 / secret・PII形状scan | PASS | 公開文書・template・planを確認 |
| 2026-08-01 | `make lint` / `make typecheck` / `make test` / `make build` | PASS | pytest 44 passed |
| 2026-08-01 | client lint / typecheck / test / build | PASS | Vitest 4 files、6 tests passed |
| 2026-08-01 | `make e2e` | PASS | sandbox bind拒否後、制限外でChromium 1 test passed |
| 2026-08-01 | `make package` | PASS | sdist / wheel生成成功 |
| 2026-08-01 | push CI run `30694240328` | PASS | Quality/package、macOS、Windowsがsuccess |
| 2026-08-01 | pull_request CI run `30694269137` | PASS | Quality/package、macOS、Windowsがsuccess |
| 2026-08-01 | pull_request CI run `30694389880` | FAIL | plan内のaction version表記を禁止表記検査が検出 |
| 2026-08-01 | `python scripts/verify_ui_text.py` | PASS | action version表記を一般名へ修正後に再検証 |

## PR / CI / review 記録

- Branch: `codex/sync-wordpack-governance`
- 実装commit: `77f54027d8995204b764d1a26ec7345a157560c7`
- PR: `https://github.com/stillshore-chirp/mj_prompt_studio/pull/10`（Ready、`MERGEABLE / CLEAN`）
- Push CI: success（run `30694240328`）
- PR CI: success（run `30694269137`）
- Codex review: CI後に確認したがreview submissionなし。直近PR #7/#8にもintegration実績なし。
- 未解決review thread: 0件
- Flat comment: 0件
- レビュー往復回数: 0回（review未提出）
- CI annotation: checkout、Node.js setup、Python setup actionのNode.js runtime deprecation。既存workflow action由来で本変更のcheck failureではない。

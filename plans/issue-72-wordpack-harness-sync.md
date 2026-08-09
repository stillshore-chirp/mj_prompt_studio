# Issue #72 Wordpack最新版ハーネス同期

## Issue

- Issue: `#72`

## Task分類

- GitHub共同作業面 / 文書 / ガバナンス変更

## 目的

MJ Prompt Studio固有の安全境界を維持したまま、Wordpack latest mainのcommon / path / task / machine構成をCodex・Claude Code・Cursor向けに適合し、古いtool固定・review回数固定・Cursor禁止を除去する。

## 非目標

- 製品UI、API、DB、LLM、保存形式、runtime dependencyの変更
- Cloud Run、Firebase、Firestore、Web認証運用の移植
- 過去plan、report、Issue、PRの履歴書き換え
- merge、Issue close、release、artifact公開

## 対象範囲

- root / nested `AGENTS.md`
- canonical SkillとClaude Code / Cursor adapter
- agent harness / AI governance正本
- Issue / PR template、plan template
- frontmatter・instruction budget・廃止ruleの機械検証とCI
- READMEと原本commit記録

## Milestone

- [x] Task 1: Wordpack latest mainとMJ Prompt Studio現行構成の差分を調査する。
- [x] Task 2: Issue #72と`agent/wordpack-harness-sync` branchを作成する。
- [x] Task 3: common / path / task / machineの4層へruleを適合する。
- [x] Task 4: docs、template、原本記録を整合する。
- [x] Task 5: local static validationとcommit-ready diffを完了する。
- [x] Task 6: commit、push、Ready PR、latest headのCI・review状態はPR本文とGitHub Checksを正本として追跡する。

## 受け入れ条件

- [x] root `AGENTS.md`が180行・16KiB以下である。
- [x] 3つのnested `AGENTS.md`が各100行・8KiB以下である。
- [x] 4つのcanonical SkillとClaude Code / Cursorのthin adapterがある。
- [x] `.cursor`禁止、特定client必須、`codex/<目的>`、固定review回数が現行正本から除去される。
- [x] MJ Prompt Studio固有の固定LLM policy、Privacy mode、local asset、画像生成サービス自動操作禁止を維持する。
- [x] 製品codeとruntime dependencyを変更しない。
- [x] harness / governance verificationがsynthetic workspaceで成功する。
- [x] PR latest headのCIとreview状態はPR本文とGitHub Checksで確認する。

## 検証command

- `python -m pip install -r requirements-agent-harness.txt`
- `bash -n scripts/verify-agent-harness.sh scripts/verify-ai-governance.sh`
- `python -m py_compile scripts/validate_agent_frontmatter.py`
- `bash scripts/verify-agent-harness.sh`
- `bash scripts/verify-ai-governance.sh`
- `git diff --check`

## 既知blocker

- なし

## 仮定・未確認事項

- Codex・Claude Code・Cursorの実際のrule / Skill discoveryは静的検証だけでは完全保証できない。
- repository connector経由のため、local product testは実行しない。製品runtime差分がないことと専用CIで範囲を限定する。

## 対象面と証跡

- 対象面: GitHub共同作業面
- 証跡: Markdown / YAML / frontmatter、relative link、instruction budget、廃止ruleの不存在、公開安全性。
- アプリ本体UI、DOM、accessibility tree、前後screenshot: N/A — 製品UI変更なし。

## Feature flag / rollback

- Feature flagなし。
- 変更はcommit revertで戻せる。
- rollbackすると旧tool固定・review反復・Cursor禁止が復活するため、原本の後続変更と整合を確認して判断する。

## 検証記録

| 日時 | command | 結果 | メモ |
|---|---|---|---|
| 2026-08-09 | `bash -n` / `py_compile` / frontmatter / budget / relative link / `git diff --check` | PASS | repository connector経由のsynthetic workspaceで確認 |
| 2026-08-09 | `bash scripts/verify-agent-harness.sh` | PASS | `Agent harness verification: PASS` |
| 2026-08-09 | `bash scripts/verify-ai-governance.sh` | PASS | `AI governance verification: PASS` |
| 2026-08-09 | `shellcheck` | 未実行 | local環境に未導入。専用GitHub Actionsで実行する |
| 2026-08-09 | GitHub Actions / review | PRで確認 | latest headのGitHub ChecksとPR本文を正本にする |

## PR / CI / Review記録

- Branch: `agent/wordpack-harness-sync`
- Commit: PRのlatest commitを参照
- PR: Issue #72をclose対象とするReady PR
- latest head: GitHub Checksを参照
- Required CI: PR本文とGitHub Checksを正本とする
- 利用可能な自動・手動review: PR本文を正本とする
- 未解決review thread: PR本文を正本とする
- review未提供時の代替自己review: static validation、budget、frontmatter、relative link、廃止ruleの不存在を確認

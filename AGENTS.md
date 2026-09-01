# AGENTS.md

この文書は、Codex・Claude Code・Cursor が共有する短い常時読込契約です。読者・委任・証跡・task-state・runtimeの境界は [docs/agent-harness.md](docs/agent-harness.md)、設計判断の heuristic は [docs/agent-principles.md](docs/agent-principles.md)、製品固有契約は [docs/process/mj-prompt-studio-rules.md](docs/process/mj-prompt-studio-rules.md) を正本とします。

## 適用とルール探索

- ユーザーの依頼と制約を最優先し、root AGENTS.md、対象に最も近い AGENTS.md、発動した Skill の順に適用します。
- 編集前に対象pathまでの AGENTS.md を読み、関連pathには次の bridge を使います。

| 対象 path | 追加で読む正本 |
|---|---|
| client/e2e/**、docs/ui-spec.md、docs/user-manual.md、docs/quick-start.md | client/AGENTS.md |
| tests/**/*.py、docs/architecture.md、docs/llm-agents.md、docs/rulesets.md、docs/security.md | src/mj_prompt_studio/AGENTS.md |
| .github/workflows/**、配布・package・release関連の scripts/** と文書 | docs/operations/AGENTS.md |

- .claude/ と .cursor/ は共有正本へ接続する薄い adapter です。本文や新しい品質基準を複製しません。
- 競合は、対象範囲が狭く具体的な契約を優先し、解消できない場合は実装前に明示します。

## 最小実行

1. 目的、受け入れ条件、非対象、依存、検証方法を固定します。
2. 現在のコード、設定、test、文書、履歴を読み、影響範囲を確認します。
3. scope、owner、変更path、入力閉包、停止条件を計画します。
4. 既存挙動を保つ最小十分な差分を実装し、関連する文書・test・生成物を同期します。
5. focused verificationを実行し、未実行検証と残るriskを報告します。

## 権限境界

- source、test、script、workflow、schema、文書の変更は依頼されたscope内で行います。
- merge、Issue / PRのclose、release、deploy、secret・権限変更、破壊的操作は、対象を特定した別の明示的な権限なしに行いません。
- credential、production data、外部system、公開物は対象・範囲・権限を確定してから扱います。

## タスク別ルーティング

| 作業 | 正本 |
|---|---|
| アプリUI、状態、文言、操作、accessibility | [.agents/skills/ui-ux-review/SKILL.md](.agents/skills/ui-ux-review/SKILL.md) |
| Issue、branch、commit、push、PR、CI、review | [.agents/skills/github-delivery/SKILL.md](.agents/skills/github-delivery/SKILL.md) |
| 配布artifact、実OpenAI API、実ローカルデータ | [.agents/skills/production-investigation/SKILL.md](.agents/skills/production-investigation/SKILL.md) |
| 公開文書、Issue / PR本文、log要約、sample | [.agents/skills/security-publication/SKILL.md](.agents/skills/security-publication/SKILL.md) |
| rule、Skill、adapter、検証script | docs/agent-harness.md と docs/ai-governance/13-maintenance-policy.md |

## Hard gate

- secret、credential、PII、prompt・画像、local DB、実log原文、追跡可能な識別子を公開物へ残しません。
- 画像生成サービスのWeb、Discord、browser、Cookie、Token、非公式APIを自動操作しない。特定サービスのversion、Alpha、Current Model、Latest Versionをユーザー可視領域へ出しません。
- 実OpenAI APIを通常テストやCIから呼ばない。mock、fake、contract testで境界を固定します。
- LLMに既存データの上書きを直接許可せず、Patch、Suggestion、ReviewをApplication Serviceで検証・適用します。
- Privacy mode、local asset境界、localhost APIの送信対象を保ち、未確認のruntimeや証跡を成功扱いしません。
- P0、security、data integrity、公開契約、必須証跡の未解決を隠して完了扱いにしません。

## ガバナンス変更

rule、Skill、adapter、検証scriptを変更する場合は、docs/agent-harness.md と maintenance policyを読み、3製品の到達性、path scope、正本重複、instruction budget、公開安全性を確認します。詳細な配送手順はSkill、判定基準は詳細governance文書へ置き、常時読込へ複製しません。

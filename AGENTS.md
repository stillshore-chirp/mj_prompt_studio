# AGENTS.md

Codexの共通業務運用は利用者ローカルの `AGENTS.md` を正本とします。このrepositoryはMJ Prompt Studio固有の契約とpath routingを定め、読者・adapter・静的検査・任意のtask-state資料は [docs/agent-harness.md](docs/agent-harness.md)、製品固有の不変条件は [docs/process/mj-prompt-studio-rules.md](docs/process/mj-prompt-studio-rules.md) に置きます。設計判断のheuristicは [docs/agent-principles.md](docs/agent-principles.md) を参照します。

## 適用とルール探索

- Codexの共通業務運用は利用者ローカルの `AGENTS.md` を優先し、このrepositoryのAGENTS.mdとSkillはMJ Prompt Studio固有の契約を追加します。
- 編集前に対象pathまでの AGENTS.md を読み、関連pathには次の bridge を使います。

| 対象 path | 追加で読む正本 |
|---|---|
| client/e2e/**、docs/ui-spec.md、docs/user-manual.md、docs/quick-start.md | client/AGENTS.md |
| tests/**/*.py、docs/architecture.md、docs/llm-agents.md、docs/rulesets.md、docs/security.md | src/mj_prompt_studio/AGENTS.md |
| .github/workflows/**、配布・package・release関連の scripts/** と文書 | docs/operations/AGENTS.md |

- .claude/ と .cursor/ は共有正本へ接続する薄い adapter です。本文や新しい品質基準を複製しません。
- 製品固有契約のpath別差分は、対象に最も近いAGENTS.mdを参照します。

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

rule、Skill、adapter、検証scriptを変更する場合は、docs/agent-harness.md と maintenance policyを読み、3製品の到達性、path scope、正本重複、instruction budget、公開安全性を確認します。共通業務手順は利用者ローカルのCodex `AGENTS.md` に従い、このrepositoryへ複製しません。

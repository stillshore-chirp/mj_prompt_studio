# エージェントハーネス設計・保守ガイド

Codexの共通業務運用は利用者ローカルの `AGENTS.md` を正本とします。この文書はMJ Prompt Studio repositoryの読者・adapter配置、既存static contract、任意task-state資料だけを説明します。機械検査や製品runtimeの代替ではありません。

## 正本、読者、責務

| 正本 | 主な読者 | 責務 |
|---|---|---|
| AGENTS.md、最寄りのAGENTS.md | 3製品 | MJ Prompt Studio固有のhard gate、path契約、routing |
| CLAUDE.md、.claude/、.cursor/ | Claude Code / Cursor | repository内の正本へ接続する薄いadapter |
| .agents/skills/<name>/SKILL.md | 3製品 | MJ Prompt Studioのtask固有契約 |
| docs/ai-governance/ | agent、reviewer | UI/UX、Issue、対象面別の証跡 |
| この文書 | agent、保守者 | routing、static contract、任意task-state資料 |
| scripts/validate_governance.py と focused tests | CI、保守者 | 正本、参照、入力分類、task-state schema、budgetのstatic検査 |

Codexは利用者ローカルの共通業務規則とroot・最寄りのAGENTS.md、該当Skillを読みます。Claude CodeはCLAUDE.mdとpath ruleから、CursorはrootとMDC routerからrepositoryの正本へ接続します。adapterは本文を複製しません。

## static contract とtask-state資料

`scripts/validate_governance.py` と `scripts/classify_verification_inputs.py` は、required file、Skill identity・router到達性、link、frontmatter、instruction budget、task-state template、変更path分類をstaticに検査します。これらの検査は製品runtimeやCodex・Claude Code・Cursorの実際のrule発見・権限・実行挙動を保証しません。

`docs/ai-governance/templates/task-state.json` は必要な作業で利用できる任意のtask-state形式例です。全taskでの作成・更新を要求しません。`measurement` と `publication` はschema内の任意項目としてvalidatorの互換性を保ちます。

設計heuristicは [docs/agent-principles.md](agent-principles.md)、製品固有のrule・Skill・adapter保守条件は [docs/ai-governance/13-maintenance-policy.md](ai-governance/13-maintenance-policy.md) を参照します。

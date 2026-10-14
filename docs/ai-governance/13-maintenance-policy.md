# ガバナンス保守方針

Codexの共通業務運用は利用者ローカルの `AGENTS.md` を正本とします。この文書は、MJ Prompt Studio固有のrule、Skill、adapter、validator、fixture、self-test、workflowを増減・変更する条件を扱います。repositoryのstatic contractは [docs/agent-harness.md](../agent-harness.md) にあります。

## 配置と責務

- root / nested AGENTS.mdはMJ Prompt Studioの製品契約とpath routing、Skillは製品固有のtask条件を持ちます。
- Claude CodeのCLAUDE.md、.claude/とCursorの.cursor/は薄いrouterです。本文や判断基準を複製しません。
- file、link、frontmatter、budget、task-state template、変更path分類のstatic contractは中央validatorとclassifierで検査します。static検査を製品runtimeのenforcementにしません。
- React client、localhost Python API、SQLite、local asset、固定LLM policy、Privacy modeの製品境界は docs/process/mj-prompt-studio-rules.md と設計docsを正本とします。

## 追加・変更・削除

変更対象はroot/nested rules、adapter、Skills、validator、classifier、workflow、testsのどの責務かを特定します。validatorが要求するfile、link、frontmatter、budget、task-state、path分類の構造と、MJ Prompt StudioのPrivacy・local asset・LLM policy契約を保ちます。履歴reportsとevidenceは正本整理の対象にしません。

## 3製品の保守ゲート

- Codex: 利用者ローカルの共通業務規則に従い、rootとnested AGENTS.mdからMJ固有契約へ到達します。
- Claude Code: CLAUDE.mdとpath ruleが共通正本へ接続し、.claude adapterに本文を複製しません。
- Cursor: root AGENTS.mdと適切なglobsを持つMDC routerが競合せず、.cursorの存在を禁止しません。
- 3製品すべてで、重要link、frontmatter、budget、公開安全性、正本重複のstatic contractを維持します。

source-sizeのestimateをHook注入量やobserved token telemetryと混同しません。static PASS、configured、observed、unverifiedを分けます。

## 静的検査と公開安全性

`scripts/validate_governance.py` のrequired structure、3製品のrouter到達性、validator budget、task-state template、Action pin検査を維持します。履歴reportsとevidenceを除く文書変更では公開安全性Skillを参照します。static PASSをruntime挙動の証拠として扱いません。

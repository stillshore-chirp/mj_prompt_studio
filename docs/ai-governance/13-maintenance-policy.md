# ガバナンス保守方針

この文書は、rule、Skill、adapter、validator、fixture、self-test、workflowを増減・変更する判断基準です。Codex、Claude Code、Cursorの読者・委任・evidence・task-state・runtimeは [docs/agent-harness.md](../agent-harness.md) を正本とします。

## 配置と責務

- 全体のhard gate・権限・最小実行は AGENTS.md、path契約は最寄りの AGENTS.md、task手順は .agents/skills/<name>/SKILL.mdに置きます。
- Claude CodeのCLAUDE.md、.claude/とCursorの.cursor/は薄いrouterです。本文や判断基準を複製しません。
- 形式・存在・参照・frontmatter・budget、入力分類、task-stateなど決定的な条件は中央validatorの scripts/validate_governance.py と変更に対応するfocused testsへ結び付けます。static検査を製品runtimeのenforcementにしません。
- React client、localhost Python API、SQLite、local asset、固定LLM policy、Privacy modeの製品境界は docs/process/mj-prompt-studio-rules.md と設計docsを正本とします。

## 追加・変更・削除

各変更は、scope、発動条件、正本owner、enforcement（static / test / runtime / advisory）、coverage、risk、instruction cost、replacementまたはsunsetを先に記録します。

- 追加前に既存の正本、adapter、Skill、validator、fixture、self-test、workflowを検索し、統合またはreplacementを先に検討します。
- ruleは全体、path、taskの層を固定します。adapterへ接続以外の長文を置きません。
- validatorやfixtureは検査可能な契約と回帰条件へ結び付け、syntheticで公開安全な入力を使います。
- workflow/jobの変更はfailure mode、trigger、runner・wall-clock cost、artifact、failure owner、統合できない理由、sunset条件を記録します。
- security、authorization、data integrity、公開API、production safetyは、可能ならruntime/config/testの機械的enforcementへ結び付けます。enforce不能な範囲はadvisory / unverifiedとして残します。
- 削除はconsumer、link、coverage、replacement、sunset理由を確認してから行います。履歴reports、evidence、plansは製品履歴・証跡として保全し、正本整理の対象にしません。

soft heuristicを自然言語のexact matchや大規模fixtureだけで固定しません。判断理由と観測可能な結果を残します。

## 3製品の保守ゲート

- Codex: rootとnested AGENTS.mdから必要な正本へ到達し、常時読込へtask本文を混入させません。
- Claude Code: CLAUDE.mdとpath ruleが共通正本へ接続し、.claude adapterに本文を複製しません。
- Cursor: root AGENTS.mdと適切なglobsを持つMDC routerが競合せず、.cursorの存在を禁止しません。
- 3製品すべてで、重要link、frontmatter、budget、公開安全性、正本重複、関連self-testを確認します。

source-sizeのestimateをHook注入量やobserved token telemetryと混同しません。static PASS、configured、observed、unverifiedを分けます。

## 停止と完了

共通hard gateへ到達できない、adapterだけに重要判断がある、正本間で条件が食い違う、replacementなしの増加、owner・enforcement・coverage・cost・sunsetが未確定、budget超過、壊れたlink、公開範囲未確認がある場合は完了扱いにしません。

変更後は同じinput closureに対する必要なgateを実行し、latest HEAD、未実行検証、残るriskを報告します。merge、Issue / PRのclose、release、deployは別の明示指示が必要です。

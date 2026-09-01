# 文書構造

文書は読者と責務ごとに正本を分け、同じ長文を複数fileへ複製しません。

| 文書 | 主な読者 | 責務 |
|---|---|---|
| README.md | 初見の利用者・開発者 | 製品概要、setup、起動、検証入口 |
| docs/quick-start.md、docs/user-manual.md | 利用者 | React clientの操作、状態、回復 |
| docs/ui-spec.md | UI実装者・reviewer | 画面とinteractionの契約 |
| docs/architecture.md | 開発者 | client、API、layer、依存方向 |
| docs/llm-agents.md | LLM実装者 | Agent、schema、固定policy、失敗契約 |
| docs/rulesets.md | domain実装者 | RulesetとCapability Profile |
| docs/security.md | 開発者・運用者 | secret、Privacy、local asset、外部送信 |
| docs/process/mj-prompt-studio-rules.md | AI agent・開発者 | MJ固有の製品hard gate |
| docs/agent-harness.md | harness保守者 | 3製品の正本、委任、証跡、task-state、runtime |
| docs/agent-principles.md | 実装者・reviewer | 設計とtestのheuristic |
| docs/ai-governance/ | UI/UX・品質reviewer | 判断基準、証跡、Issue品質、完了条件 |
| docs/process/agent-general-rules.md、task-execution.md | 過去linkの読者 | 現行正本への互換入口だけ |
| plans/、reports/、evidence/ | task実行者・履歴読者 | 計画、検証記録、履歴artifact |

## 更新判断

- 利用者が見る操作、文言、状態が変わる: user-manualとui-spec。
- API、layer、schema、固定LLM policy、Privacy、local assetの意味が変わる: architecture、llm-agents、security、rulesets。
- setup、起動、検証入口が変わる: READMEとdocs/process/ci.md。
- agent ruleの発動、配置、委任、証跡、検証が変わる: agent-harnessと13-maintenance-policy。
- 一時的な判断、検証log、完了checklistはplans、Issue、PRへ置き、恒久文書へ混ぜません。

## Linkと公開安全性

- 相対linkを優先し、移動時に参照切れを検出します。
- API key、prompt全文、画像、DB・log原文、local path、実識別子を文書へ載せません。
- reports、evidence、plansは履歴artifactとして保ち、現在の正本と誤認させる入口linkを増やしません。

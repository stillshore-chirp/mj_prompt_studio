# 文書構造

本リポジトリの文書は、読者と責務ごとに正本を分けます。同じ長文を複数fileへcopyしません。

| 文書 | 主な読者 | 責務 |
|---|---|---|
| `README.md` | 初見の利用者・開発者 | 製品概要、最短setup、主要入口 |
| `docs/quick-start.md` | 一般利用者 | 最初の利用手順 |
| `docs/user-manual.md` | 一般利用者 | 目的別の操作、状態、回復方法 |
| `docs/ui-spec.md` | UI実装者・reviewer | 画面とinteractionの契約 |
| `docs/architecture.md` | 開発者 | component、layer、依存方向 |
| `docs/llm-agents.md` | LLM実装者 | Agent、schema、固定policy、失敗契約 |
| `docs/rulesets.md` | domain実装者 | RulesetとCapability Profile |
| `docs/security.md` | 開発者・運用者 | secret、privacy、local asset境界 |
| `docs/process/mj-prompt-studio-rules.md` | AIエージェント・開発者 | 製品固有の開発hard gate |
| `docs/ai-governance/` | UI/UX・品質reviewer | 判断基準、証跡、Issue品質 |
| `docs/agent-harness.md` | ハーネス保守者 | 3製品へのrule配置とinstruction budget |
| `docs/agent-principles.md` | 実装者・reviewer | 設計とtestのheuristic |
| `plans/` | task実行者 | task固有の計画と検証記録 |

## 更新判断

- 利用者が見る操作、文言、状態が変わる: `docs/user-manual.md` と `docs/ui-spec.md`。
- API、layer、依存方向が変わる: `docs/architecture.md`。
- Agent、schema、送信対象、Privacy mode、固定LLM policyが変わる: `docs/llm-agents.md` と `docs/security.md`。
- Rulesetやdomain意味が変わる: `docs/rulesets.md`。
- setup、起動、検証入口が変わる: `README.md`。
- エージェントruleの発動・配置・検証が変わる: `docs/agent-harness.md` と `docs/ai-governance/13-maintenance-policy.md`。
- 一時的な判断、検証log、完了checklist: `plans/` またはIssue / PR。恒久文書へ作業記録を混ぜない。

## Linkと公開安全性

- 相対linkを優先し、移動時に参照切れを検出できるようにする。
- 文書へAPI key、prompt全文、画像、DB・log原文、local path、実識別子を載せない。
- 過去のplanやreportは履歴として保ち、現在の正本と誤認されないよう入口文書から直接参照しない。

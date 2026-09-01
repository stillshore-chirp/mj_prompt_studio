# AIガバナンス文書インデックス

このdirectoryは、AI agent支援開発のUI/UX、証跡、完了条件、Issue品質、残るriskを扱う詳細正本です。企業全体の法務・倫理審査やmodel監査を意味しません。

共通契約は [AGENTS.md](../../AGENTS.md)、3製品の読者・adapter・委任・evidence・task-state・runtimeは [docs/agent-harness.md](../agent-harness.md)、task手順は [.agents/skills/](../../.agents/skills/) を優先します。

## 読み方

全詳細文書を毎回機械的に読みません。変更範囲から必要な正本を選びます。

### 全作業

- root AGENTS.md
- 変更対象に最も近い AGENTS.md
- 発動条件に該当するSkill

### UI/UX変更

1. .agents/skills/ui-ux-review/SKILL.md
2. 02-uiux-review-framework.md
3. 03-evidence-and-completion-gates.md

必要に応じて、04 cognitive、05 accessibility、06 visual hierarchy、07 copy、08 state、09 review、10 utility、11 efficiency、12 trustを追加で読みます。

### Issue・rule・配送

- Issueの作成・更新: 14-issue-quality-gate.md
- rule、Skill、adapter、validatorの変更: 13-maintenance-policy.md と docs/agent-harness.md
- evidenceと完了判定: 03-evidence-and-completion-gates.md
- GitHub配送: .agents/skills/github-delivery/SKILL.md
- 公開物の安全性: docs/security-publication-checklist.md

## 対象面

- アプリ本体UI: React clientがlayout、操作、状態、focus、accessibilityを実装する画面。
- GitHub共同作業面: Issue / PR template、repository Markdown、workflow説明など。変更した文言、構造、表示、link、公開安全性を範囲に比例して確認します。
- 混在: 両方を別々に確認し、一方の証跡で他方を代用しません。
- N/A: UIまたはGitHub共同作業面を変更しない理由を短く示します。

## TemplateとChecklist

- templates/uiux-review-report.md、state-matrix.md、novice-simulation.md、counter-review.md
- templates/completion-gate-report.md、user-goal-assessment.md、efficiency-review.md、trust-satisfaction-review.md、agent-task-prompt.md
- checklists/ のP0/P1/P2、accessibility、認知、視覚階層、content、utility、efficiency、trust

## MJ Prompt Studioでの適用

- React clientはWeb accessibility、狭幅、文字拡大、keyboard、E2Eを確認します。
- localhost Python API、固定LLM policy、保存、Privacy、local assetの変更でユーザーが見る結果、待機、error、送信対象が変わればUI/UX対象として扱います。
- prompt、参照画像、生成画像、API key、SQLite、assetの扱いは docs/security.md と公開安全性Skillを優先します。
- version非依存の表記と画像生成サービス自動操作禁止は docs/process/mj-prompt-studio-rules.md を優先します。

## 言語

本文は日本語を正式版とします。英語は外部標準、file名、toolが読むkeyword、一般的な技術用語に限ります。

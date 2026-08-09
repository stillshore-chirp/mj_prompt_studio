# AIガバナンス文書インデックス

このdirectoryは、AIエージェント支援開発の作業品質、UI/UX review、検証証跡、完了条件、残リスクを扱う詳細正本です。企業全体のAI統制、法務・倫理審査、model監査を意味しません。

共通の作業契約は [`AGENTS.md`](../../AGENTS.md)、3製品へのrule配置は [`docs/agent-harness.md`](../agent-harness.md)、task固有の実行順序は [`.agents/skills/`](../../.agents/skills/) を優先します。

## 読み方

全詳細文書を毎回機械的に読みません。変更範囲から必要な正本を選びます。

### 全作業

- ルート `AGENTS.md`
- 変更対象に最も近い `AGENTS.md`
- 発動条件に該当するSkill

### UI/UX変更

最低限、次を読みます。

1. `.agents/skills/ui-ux-review/SKILL.md`
2. `02-uiux-review-framework.md`
3. `03-evidence-and-completion-gates.md`

変更内容に応じて次も読みます。

- 認知負荷、初見理解: `04-cognitive-psychology-principles.md`
- accessibility: `05-accessibility-and-inclusive-design.md`
- 視覚階層、情報設計: `06-visual-hierarchy-and-information-architecture.md`
- copy、label、error文: `07-ui-copy-and-microcopy.md`
- 状態、error回復: `08-state-design-and-error-recovery.md`
- review手順: `09-ai-agent-review-protocol.md`
- ユーザー価値: `10-utility-user-goal-and-product-fit.md`
- 熟練者効率: `11-efficiency-and-expert-use.md`
- 満足感、安心感、信頼感: `12-satisfaction-trust-and-emotional-ux.md`
- rule変更: `13-maintenance-policy.md`
- Issue品質: `14-issue-quality-gate.md`
- 3製品互換性: `15-agent-harness-compatibility.md`

## 対象面

- **アプリ本体UI**: React clientがlayout、操作、状態、focus、accessibilityを実装する画面。UI/UX Skillの全手順を適用する。
- **GitHub共同作業面**: Issue / PR template、repository Markdown、workflow説明など。変更した文言、構造、表示、link、公開安全性だけを範囲に比例して確認する。
- **混在**: 両方を別々に確認し、一方の証跡で他方を代用しない。

## Template

- `templates/uiux-review-report.md`: UI/UX review全体
- `templates/state-matrix.md`: 状態網羅
- `templates/novice-simulation.md`: 初見simulation
- `templates/counter-review.md`: 反証review
- `templates/user-goal-assessment.md`: ユーザー価値
- `templates/efficiency-review.md`: 熟練者効率
- `templates/trust-satisfaction-review.md`: 満足感・信頼感
- `templates/completion-gate-report.md`: 完了判定
- `templates/agent-task-prompt.md`: UI/UX taskの最小入口

## Checklist

`checklists/` にP0/P1/P2、accessibility、認知的walkthrough、視覚階層、content stress、ユーザー価値、効率、信頼感の確認表を置きます。

## MJ Prompt Studioでの適用

- React clientはWeb accessibility、狭幅、文字拡大、keyboard、E2Eを確認する。
- localhost Python APIやLLM変更でも、ユーザーが見る結果、待機、error、保存、送信対象が変わればUI/UX変更として扱う。
- prompt、参照画像、生成画像、API key、SQLite、assetなどの扱いは `docs/security.md` と公開安全性Skillを優先する。
- ユーザー可視領域の禁止表記と画像生成サービス自動操作禁止は `docs/process/mj-prompt-studio-rules.md` を優先する。

## 言語方針

本文は日本語を正式版とします。英語は外部標準、file名、toolが読むkeyword、一般的な技術用語に限り、必要なら `glossary.md` へ意味を追加します。

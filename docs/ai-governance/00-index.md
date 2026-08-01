# AIガバナンス文書インデックス

このディレクトリは、AIエージェント支援開発の作業品質、UI/UXレビュー、検証証跡、完了条件、残リスクを扱う詳細正本です。企業全体のAI統制、法務・倫理審査、モデル監査を意味しません。

## 必須の読み方

すべての変更では `AGENTS.md` と `01-agent-operating-contract.md` を読みます。UI/UX変更では最低限、次を順に読みます。

1. `AGENTS.md`
2. `.agents/skills/ui-ux-review/SKILL.md`
3. `docs/ai-governance/00-index.md`
4. `docs/ai-governance/glossary.md`
5. `docs/ai-governance/01-agent-operating-contract.md`
6. `docs/ai-governance/02-uiux-review-framework.md`
7. `docs/ai-governance/03-evidence-and-completion-gates.md`

変更内容に応じて次も読みます。

- 認知負荷、初見理解: `04-cognitive-psychology-principles.md`
- アクセシビリティ: `05-accessibility-and-inclusive-design.md`
- 視覚階層、情報設計: `06-visual-hierarchy-and-information-architecture.md`
- コピー、ラベル、エラー文: `07-ui-copy-and-microcopy.md`
- 状態、エラー回復: `08-state-design-and-error-recovery.md`
- レビュー手順: `09-ai-agent-review-protocol.md`
- ユーザー価値: `10-utility-user-goal-and-product-fit.md`
- 熟練者効率: `11-efficiency-and-expert-use.md`
- 満足感、安心感、信頼感: `12-satisfaction-trust-and-emotional-ux.md`
- ルール変更: `13-maintenance-policy.md`
- Issueの理由・根拠・成果・受け入れ条件: `14-issue-quality-gate.md`

## テンプレート

- `templates/uiux-review-report.md`: UI/UXレビュー全体
- `templates/state-matrix.md`: 状態網羅
- `templates/novice-simulation.md`: 初見シミュレーション
- `templates/counter-review.md`: 反証レビュー
- `templates/user-goal-assessment.md`: ユーザー価値
- `templates/efficiency-review.md`: 熟練者効率
- `templates/trust-satisfaction-review.md`: 満足感・信頼感
- `templates/completion-gate-report.md`: 完了判定

## チェックリスト

`checklists/` にP0/P1/P2、アクセシビリティ、認知的ウォークスルー、視覚階層、content stress、ユーザー価値、効率、信頼感の確認表を置きます。

## 品質の定義

UIを「美しいか」だけで評価しません。価値があり、初見で理解でき、操作と状態が分かり、失敗から戻れ、多様な利用者が使え、慣れても速く、安心でき、証跡で説明できることを評価します。

## MJ Prompt Studio での適用

- React clientはWebアクセシビリティ、狭幅、文字拡大、キーボード、E2Eを確認します。
- localhost Python APIやLLM変更でも、ユーザーが見る結果、待機、エラー、保存、送信対象が変わればUI/UX変更として扱います。
- 参照画像、生成結果、prompt、API keyなどローカル資産・機微情報の扱いは `docs/security.md` と公開安全性チェックリストを優先します。
- ユーザー可視領域の禁止表記と画像生成サービス自動操作禁止は `docs/process/mj-prompt-studio-rules.md` を優先します。

## 言語方針

本文は日本語を正式版とします。英語は外部標準、ファイル名、toolが読むkeyword、一般的な技術用語に限り、必要なら `glossary.md` へ意味を追加します。

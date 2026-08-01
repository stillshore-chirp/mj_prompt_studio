# Issue #21 操作可否と成功feedback

## 概要

- 対象Issue / 作業: #21 / Composer、Free Editor、Matrix Lab
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象・文脈・目的: Promptを編集・構造化・出力する利用者が、空の対象に対するLLM jobやコピーを送らず、必要な入力を把握する。
- 支援task: 空のAI Brief、Prompt Blocks、Free Editor、Matrix Objective、Compiled Prompt、Matrix variantで、実行可否と次の入力を判断する。
- 改善: 操作をdisabledにし、buttonの近くの常時表示文で有効化条件または処理対象を示す。コピー成功はCompiled Prompt、variant、件数、CSV/Markdownを区別する。
- 検証仮説: 空操作による不正確な成功通知と不要なjobを防ぐ。実ユーザー評価は未実施。

## 初見・state matrix

| 状態 | 表示・理解 | 次行動 / 回復 | a11y・証跡 | 判定 |
|---|---|---|---|---|
| Composer空 | Compile、AI Brief構造化、生成済みPromptコピーはdisabled | AI BriefまたはPrompt Blocksを入力 | `aria-describedby`とunit/E2E | Pass |
| Composer入力済み | CompileとAI Brief構造化の対象を説明 | 実行できる | button名、status、after screenshot | Pass |
| Free Editor空 | 全変換をdisabled | Japanese SourceまたはEnglish Promptを入力 | `aria-describedby`とunit/E2E | Pass |
| Matrix Objective空 | AI PlanとGenerateをdisabled | Objectiveを入力しAI Planを作成 | `aria-describedby`とunit/E2E | Pass |
| Matrix planあり | Generateの対象を説明 | variantを生成できる | unit/E2E | Pass |
| variantなし | copy/exportをdisabled | plan生成後にvariantを作成 | 既存selection status/E2E | Pass |
| copy/export成功 | 実際の対象名・件数を通知 | 続けて貼付・利用できる | Appの対象別status | Pass |

## 品質確認

- accessibility: 主要buttonはnative `disabled`、visibleな補足文を`aria-describedby`で関連付けた。icon-only copy buttonは「生成済みPromptをコピー」という固有名を持つ。既存Matrix行のkeyboard選択E2Eも通過。
- 視覚階層: 有効化条件は対象buttonの直後に置き、tooltipや一時通知だけに依存しない。狭幅reflowは既存E2Eで回帰なし。
- copy: 対象、行動、有効化条件を具体的に表現し、禁止表記なし。
- 熟練者効率: 入力済みなら余分な確認を増やさず即時に有効化する。
- 満足感・信頼感: コピー成功は対象と件数を示し、Clipboard失敗時は既存のManual Copy回復導線を維持する。
- 反証レビュー: 生成済みPrompt copyのaccessible nameが`Compile`と部分一致し既存導線を曖昧にする点をE2Eで検出し、「生成済みPromptをコピー」に修正済み。

## 証跡・検証

- 変更前screenshot: `/private/tmp/mjps-issue-21-before.png`（Mockデータのみ）
- 変更後screenshot: `/private/tmp/mjps-issue-21-after.png`（Mockデータと安全なfixture入力のみ）
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（28 tests）、`make client-build`、隔離Mock Playwright（15 tests）、前後画面の目視確認。
- 未実施: 実OpenAI API・実ユーザー評価は実行していない。今回の操作可否・表示変更の契約範囲外であり、実運用での利用頻度は未確認。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実ユーザー評価 | ローカル開発タスク | 用語の理解度は未計測 | 実利用feedbackを次回評価へ反映 |

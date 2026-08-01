# Issue #23 内部用語を排したUI copy

## 概要

- 対象Issue / 作業: #23 / 確認画面、AIの状況、AI処理、Prompt Doctor、主要status
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象・文脈・目的: 制作中の利用者が、API schemaやAgent実装名を知らなくても、変更対象・影響・結果を確認して安全に適用・再試行できる。
- 支援task: Prompt Doctorの提案確認、パラメータ提案確認、AI処理の状態確認、保存・出力・API key設定の結果確認。
- 改善: field pathとraw JSONを表示名・値の要約へ変換し、Agent名を制作上のAI支援名へ変換した。成功/失敗は対象・影響・次行動を示す。
- 検証仮説: 内部用語を判断材料から外すことで、初見利用者が「何が変わるか」を説明しやすくなる。実ユーザー評価は未実施。

## 初見・state matrix

| 状態 | 表示・理解 | 次行動 / 回復 | a11y・証跡 | 判定 |
|---|---|---|---|---|
| Patch確認 | 提案理由、変更項目、現在/提案内容、確からしさ | 適用またはキャンセル | dialogのlabel/focus/E2E、after screenshot | Pass |
| パラメータ確認 | 設定名と提案値だけを表示 | 適用またはキャンセル | raw JSON非表示E2E | Pass |
| AI処理中/失敗 | 制作上の処理名、状態、再試行/取消 | 対象の処理を再試行または取消 | accessible name/unit/E2E | Pass |
| 保存・出力成功 | 保存/出力した対象と続けてできること | 結果を確認または次の編集 | status copy | Pass |
| API/接続error | 接続・設定の確認と内容未変更を説明 | 設定確認後に再試行 | status copy | Pass |

## 品質確認

- accessibility: icon-only controlsのaccessible nameを処理結果まで含む名称へ更新。確認dialogのkeyboard focus/復帰は既存E2Eで維持し、内部path非表示を追加確認した。
- 視覚階層: dialogは制作判断に必要な理由・項目・前後値を表示し、技術識別子を主要情報から除いた。
- copy: `Reason`、`Field`、`Old/New`、`confidence`、Agent実装名、raw JSONを日本語の対象・結果表現へ置換した。特定の画像生成サービスversion表記なし。
- 熟練者効率: 既存の適用・取消・再試行操作数を増やさず、表示変換を共通utilityへ集約した。
- 満足感・信頼感: 保存・出力・接続・失敗の影響と次行動を明記し、ClipboardのManual Copy回復導線を「手動でコピー」として維持した。
- 反証レビュー: Jobsの実行構成表示が設定画面のモデル名と重複しE2E selectorを曖昧にしたため、設定領域へlocatorを限定して回帰を防止した。

## 証跡・検証

- 変更前screenshot: `/private/tmp/mjps-issue-23-before.png`（Mock fixtureのみ）
- 変更後screenshot: `/private/tmp/mjps-issue-23-after.png`（Mock fixtureのみ）
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（30 tests）、`make client-build`、隔離Mock Playwright（15 tests）、前後画面の目視確認。
- 未実施: 実OpenAI API・実ユーザーテストは未実施。表示契約とMock workflowのみを確認した。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実ユーザー評価 | ローカル開発タスク | 用語の理解度は未計測 | #22の手順で匿名・任意の評価を行う |

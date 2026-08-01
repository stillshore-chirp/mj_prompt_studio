# Issue #24 現在のAI実行構成と履歴の区別

## 概要

- 対象Issue / 作業: #24 / AI Inspector
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象・文脈・目的: 制作中の利用者が、AI Inspectorで「いま全AI機能に使われる固定構成」と「過去に保存された実行記録」を取り違えず、次のAI支援を安心して実行できる。
- 支援task: 現在の実行構成の確認、保存済み履歴の確認、legacy構成との差異の判断。
- 改善: 現在の固定構成を設定APIのeffective値から独立表示し、保存済みのagent/model/reasoning/verbosityは「実行履歴」として表示する。差異があるときは、次回は現在構成で実行し履歴自体は変更しないことを説明する。
- 検証仮説: `Model`だけを現在形で表示するより、構成と履歴を見出しで分けた方が初見利用者がモデル移行後の記録を現在設定と誤認しにくい。実ユーザー評価は未実施。

## 初見・state matrix

| 状態 | 表示・理解 | 次行動 / 回復 | a11y・証跡 | 判定 |
|---|---|---|---|---|
| 現在構成・履歴なし | 「現在の固定AI構成」と編集不可の説明、履歴なしの理由 | 最初のAI支援を実行すると履歴を確認できる | `dl`、見出し階層、mock後screenshot | Pass |
| 現在構成と一致する履歴 | 最後のAI支援と実行時構成を履歴として表示 | 次のAI支援は固定構成で継続できる | component test | Pass |
| legacy構成の履歴 | 過去の記録であり現在と異なること、次回実行と履歴保持への影響を表示 | 現在の固定構成で次のAI支援を実行 | legacy component test | Pass |
| 保存値がない/不完全 | 履歴なしを表示し、空のmodelを現在構成として扱わない | 最初のAI支援を実行 | 既存空状態とcomponent logic | Pass |

## 品質確認

- accessibility: 「現在の固定AI構成」「保存済みのAI実行履歴」を見出しと`dl`で分離し、状態説明は通常の読み順で到達できる。構成を変更するform controlは追加していない。
- 視覚階層: 現在構成を最上段、補助的な履歴を次段に置き、差異説明を履歴の直後に置いた。
- copy: `使用中のモデル`という現在形の曖昧なlabelを廃止し、過去の記録・次回実行・履歴非改変を日本語で明示した。画像生成サービスの特定version表記は追加していない。
- 熟練者効率: Inspector内で現在構成と最後の実行を一画面で比較でき、Settingsへの往復や再実行は不要。
- 満足感・信頼感: 固定構成を変更可能に見せず、legacy履歴を削除・書換しないことを先に説明する。サーバー側の既存継続可否判定は変更していない。
- 反証レビュー: legacyの値を現在値として再表示する、またはSettingsの固定構成と異なるUI経路で変更可能にするP1を確認し、いずれも発生しないことをcomponent testと差分確認で確認した。

## 証跡・検証

- 変更前screenshot: `/private/tmp/mjps-issue-24-before.jpg`（隔離mockデータのみ）
- 変更後screenshot: `/private/tmp/mjps-issue-24-after.jpg`（隔離mockデータのみ）
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（31 tests）、`make client-build`、隔離Mock Playwright（15 tests）、AI Inspector空履歴のDOM/画面目視、legacy履歴component test。
- 未実施: 実OpenAI API、実ユーザー評価、実ユーザーが持つlegacyデータでの確認は未実施。保存履歴を変更しない表示契約とMock workflowのみを確認した。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実ユーザー評価 | ローカル開発タスク | 差異説明の理解度は未計測 | #22の匿名・任意調査手順で評価する |
| 実OpenAI API | CI・ローカル検証では実APIを使わない方針 | 実APIの応答差は未確認 | opt-in credentialed smokeで別途確認する |

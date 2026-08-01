# Issue #25 初回空・検索結果なし・部分状態の次行動

## 概要

- 対象Issue / 作業: #25 / Reference Library、Result Review、Matrix Lab
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象・文脈・目的: 初めての利用者が、素材・生成結果・Matrix variantがない画面で、目的、必要な準備、最初の安全な行動を3秒で理解できる。
- 支援task: 参照素材の追加、検索の回復、生成結果画像の追加、Matrix plan作成、variant生成。
- 改善: 初回空、検索結果なし、plan済みでvariantなしを区別し、原因、対象、次行動、復帰方法を表示する。空状態のボタンは既存の主要操作へfocusを移し、キーボードで続けられる。
- 検証仮説: 一覧が空の理由と最初の行動を同時に出すことで、画面を誤操作や故障と誤認せずに作業開始できる。実ユーザー評価は未実施。

## 初見・state matrix

| 状態 | 表示・理解 | 次行動 / 回復 | a11y・証跡 | 判定 |
|---|---|---|---|---|
| Reference初回空 | 素材がなく、追加後にできる分析を説明 | 画像追加buttonへfocus | role/status・component focus test | Pass |
| Reference検索なし | queryに一致しないが素材は残ると説明 | 検索をクリアしinputへfocus | `aria-live`・component test | Pass |
| Result初回空 | 画像追加後にReview/比較できると説明 | 画像追加buttonへfocus | component focus test | Pass |
| Matrix初回空 | ObjectiveとAI Planの関係を説明 | Objective inputへfocus | `aria-live`・component focus test | Pass |
| Matrix部分状態 | plan作成済みでvariant未生成と説明 | Generate buttonへfocus | `aria-live`・component focus test | Pass |
| 画像ファイル不正 | 既存upload controlが形式と再試行先を表示 | 画像を選び直す | 既存`role=status`/E2E | Pass |

## 品質確認

- accessibility: 新しい状態は見出し・通常の文書構造で読み上げ、状態変化は`aria-live`/`status`を使う。主要taskへ移動するbuttonはnative buttonで、focus先をcomponent testで確認した。
- 視覚階層: 通常の一覧/表にだけ空状態を置き、素材またはvariantがある通常状態には表示しない。説明は短く、既存の主要操作を複製しない。
- copy: 「存在しない」原因、素材が削除されていない影響、追加/クリア/入力/生成という次行動を明記した。特定の画像生成サービスversion表記なし。
- 熟練者効率: 検索結果なしから1操作で全件へ戻り、通常の一覧・比較・出力操作は変更しない。
- 満足感・信頼感: 初回空と検索なしを混同させず、不正画像で既存データを変更しないことを既存upload statusで維持した。
- 反証レビュー: `Generate`を含む補助button名が既存E2E locatorを曖昧にしたため、「生成ボタンへ移動」へ変更して既存操作と分離した。

## 証跡・検証

- 変更前screenshot: `/private/tmp/mjps-issue-25-before.jpg`（隔離mockデータのみ）
- 変更後screenshot: `/private/tmp/mjps-issue-25-after.jpg`（隔離mockデータのみ）
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（34 tests）、`make client-build`、隔離Mock Playwright（15 tests）、初回空・検索なし・部分状態のfocus遷移component test。
- 未実施: 実OpenAI API、実ユーザー評価は未実施。Mock UIと状態遷移のみを確認した。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実ユーザー評価 | ローカル開発タスク | 説明量と初見理解は未計測 | #22の匿名・任意調査手順で評価する |

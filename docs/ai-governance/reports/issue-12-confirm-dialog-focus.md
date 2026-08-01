# UI/UXレビュー報告: Issue #12 確認ダイアログのkeyboard操作

## 概要

- 対象Issue / PR / 作業: [#12](https://github.com/stillshore-chirp/mj_prompt_studio/issues/12) / PR作成前 / 確認ダイアログのfocus管理
- 画面・component・状態: Patch適用、参照削除、Manual CopyのConfirmDialog。開く、Tab、Shift+Tab、Esc、キャンセル、確定、閉じる。
- 判定: Pass（ローカル検証・隔離mock E2E・視覚証跡）/ PR・CI・reviewは未実施
- P0 / P1 / P2件数: 既知P0を1件修正済み / 新規0件 / 新規0件

## ユーザー価値

- 対象、文脈、目的、支援task: Patch適用、参照削除、コピー失敗からの手動コピーを確認する利用者が、背景を誤操作せず安全に確定または取消する。
- 助ける理解・判断・行動・回復: dialogの目的と影響を読み上げ、最初の安全な操作へfocusし、Tab移動・Esc・キャンセル・確定後に呼び出し元へ戻れるようにする。
- UIがなければ困る点 / 削る候補: 背景操作やfocus逸脱により、意図しない変更・削除や現在地喪失が起きる。focus trapと復帰は削れない。
- 検証仮説（未計測なら明記）: keyboardだけで安全に閉じられ、元の操作位置に戻れれば、確認操作による中断と誤操作の不安を減らせる。実利用者評価は未計測。

## 初見・state matrix

- 画面目的、現在地、最初の行動、結果予測、回復: 操作直後に開く確認ダイアログは、説明を聞いてから「キャンセル」または具体的な確定操作を選ぶ。Esc・キャンセルは何も変更せず呼び出し元へ戻り、確定は対象の処理を行う。

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| Patch確認 | 変更内容と適用影響 | 確認後にだけ変更される | キャンセル / 変更を適用 | Esc・キャンセル | modal dialog、説明、初期focus | component test / screenshot / E2E | Pass |
| 削除確認 | 対象名と取消不可 | 参照を削除する危険操作 | キャンセル / 削除する | Esc・キャンセル | modal dialog、説明、初期focus | component test | Pass |
| Manual Copy | 手動コピーの説明とテキスト | コピー失敗でも内容を失わない | テキストをコピー / 閉じる | Esc・閉じる | modal dialog、説明、textarea focus | component test | Pass |
| Tab / Shift+Tab | dialog内の操作だけ | 背景へ移動しない | 次 / 前のcontrol | dialog内循環 | focus trap、背景inert | component test / keyboard E2E | Pass |
| Esc / キャンセル | dialogが閉じる | 変更せず取消した | 元の操作を続ける | 呼び出し元へfocus復帰 | `aria-modal`、return focus | component test / keyboard E2E | Pass |
| 確定後 | 処理結果と元の画面 | 適用・削除・閉じる結果 | 次の作業 | statusと呼び出し元の画面 | 既存status | component test | Pass |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: 初期focus、focus trap、Esc、return focus、背景`inert`と`aria-hidden`、`aria-labelledby`、`aria-describedby`をcomponent testとPatchのkeyboard E2Eで確認した。
- 視覚階層（主操作、grouping、密度、狭幅）: 既存のmodal構造を維持し、危険な削除よりキャンセルを安全な最初の操作にする。変更前後のPatch確認画面を確認した。狭幅reflowはIssue #20で扱う。
- copy（用語、error、空、disabled、tone、禁止表記）: 確定labelと説明をPatch適用・パラメータ適用・削除・手動コピーの結果と影響に合わせ、特定サービスのバージョン番号を出さない。
- 熟練者効率（手数、保持、近道）: Escとreturn focusにより、取消時の余分なポインタ操作を増やさない。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: 削除の取消不可とコピー失敗時の内容保持を明示し、背景操作を止める。
- 反証レビュー: focusがdialog外へ逸脱する、Escが二重実行する、複数dialogが同時に背景を復帰する、処理失敗でdialogが不意に閉じる、説明が対象・影響を示さない状態をcomponent test・E2E・状態管理差分で確認した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P0 | `ConfirmDialog` | 初期focus、focus trap、Esc、return focus、背景inert、説明関連付けがない | keyboard・支援技術利用者が背景を誤操作し、危険操作の確認を安全に完了できない | 共通dialogへfocus管理・ARIA説明を実装し、3導線を回帰検証する | 修正済み |

## 証跡・検証

- 変更前/変更後screenshot: 安全なmock fixtureで取得し、変更前の汎用的な確認と変更後の対象・影響・具体的な操作を目視確認した。PR本文へ添付する。ユーザー入力・画像・API keyは写さない。PNGにprofile metadataはない。
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（15 passed）、`make client-build`、Pythonのlint/typecheck/test/build（44 passed）、`make verify-governance`を通過。隔離mock環境で自動提案、確認dialog、既存core workflowのPlaywright E2E 3件が通過した。
- 取得できなかった証跡と理由: 標準E2Eは既存local serverが標準portを使用中のため起動できなかった。利用者processを停止せず、別port・新規mockデータの同等E2Eで代替した。実OpenAI APIと実ユーザー評価は未実施。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実OpenAI API | テストで実APIを呼ばないポリシー | dialog後の実API失敗時表示はmockと異なる可能性 | 明示opt-inの実環境確認を別途実施 |
| 実ユーザー評価 | まだ実施していない | 実利用時のcopy理解度は未計測 | 後続のユーザー評価で確認 |

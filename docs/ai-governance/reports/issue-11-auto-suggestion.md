# UI/UXレビュー報告: Issue #11 Composerの自動提案

## 概要

- 対象Issue / PR / 作業: [#11](https://github.com/stillshore-chirp/mj_prompt_studio/issues/11) / PR作成前 / Composerの自動提案Job連鎖停止
- 画面・component・状態: Composer、Live Preview、自動提案の待機・queued・running・succeeded・failed
- 判定: Pass（ローカル検証・隔離mock E2E・視覚証跡）/ PR・CI・reviewは未実施
- P0 / P1 / P2件数: 既知P0を1件修正中 / 新規0件 / 新規0件

## ユーザー価値

- 対象、文脈、目的、支援task: Prompt Blocksを編集し、AIの補助案を確認してから適用する利用者。
- 助ける理解・判断・行動・回復: 編集停止後の送信、提案の待機、確認が必要な適用、失敗時の再編集による再試行を説明する。
- UIがなければ困る点 / 削る候補: 自動送信の時機と安全性が不明なまま、背景でJobが増え続ける。説明と`role=status`はこの操作の信頼に必要である。
- 検証仮説（未計測なら明記）: 同じ編集でJobが一件に収まれば、待機時間とJobs履歴のノイズを減らし、提案への信頼を回復できる。利用者評価は未計測。

## 初見・state matrix

- 画面目的、現在地、最初の行動、結果予測、回復: ComposerのPrompt Blocksを編集すると、1秒の入力停止後に最新編集だけをAI補助へ送る。提案は自動適用されず、既存の確認操作で反映する。失敗時は編集すれば新しいrevisionとして再試行できる。

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| 初期表示 | 送信予定の説明 | 初期データだけでは送信しない | Prompt Blocksを編集 | N/A | `role=status` | component test | Pass |
| 入力停止前 | 送信時機と自動適用しない説明 | 次の送信は最新編集のみ | 入力を続ける / 停止する | debounceを取消して新revisionへ | `role=status` | component test | Pass |
| queued | 送信済み・確認後適用の説明 | Job作成済み | 待つ / 編集する | 新しい編集は古い結果を隠す | `aria-live=polite` | application logic review | Pass |
| running | 提案準備中・自動適用しない説明 | 実行中だが破壊的変更なし | 待つ / 編集する | 新revisionへ切替 | `aria-live=polite` | application logic review | Pass |
| succeeded | 最新入力の提案を確認できる説明 | 確認してから適用する | 既存Patch確認操作 | 提案を拒否または編集 | `aria-live=polite` | application logic review | Pass |
| failed | 失敗と再試行方法 | 自動適用されず、編集で再試行可能 | 入力を編集する | 次revisionで1件送信 | `aria-live=polite` | application logic review | Pass |
| 古いJob完了 | 古い提案を表示しない | 現在の編集を守る | 最新提案を待つ | latest revision照合 | statusを古い内容で上書きしない | application logic review | Pass |
| 16文字未満 | 送信時機の説明 | 送信対象外 | 内容を補う | 16文字以上の新revision | `role=status` | component test | Pass |
| keyboard / screen reader | 入力fieldとlive status | 送信・待機・安全性を把握 | 通常のtextarea操作 | N/A | field label、`role=status`、`aria-live=polite` | component test / DOM確認 | Pass |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: 既存textareaのlabelを維持し、状態文に`role=status`と`aria-live=polite`を付与。新しい操作・focus移動は追加しない。
- 視覚階層（主操作、grouping、密度、狭幅）: statusは編集gridとPreviewの間に小さく配置し、保存・Compileの主要操作を押し下げない。狭幅reflowはIssue #20で扱う。
- copy（用語、error、空、disabled、tone、禁止表記）: 「送信」「確認」「自動適用されない」「再試行」を具体化し、特定サービスのバージョン番号を出さない。全画面のcopy統一はIssue #23で扱う。
- 熟練者効率（手数、保持、近道）: 同一revisionの無駄なJobを除き、既存の入力停止後の補助フローは維持する。shortcutはIssue #29で扱う。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: 入力内容がAI補助へ送られるタイミングと、提案が自動適用されないことを明示する。失敗時に再試行の行動を示す。
- 反証レビュー: 親callbackの参照更新、Jobのqueued/running/succeeded更新、過去Jobの完了をそれぞれ再送トリガーにしない。新しい編集はrevisionを進め、同一内容に戻した場合も新しい利用者編集として一度だけ送信する。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P0 | Composerの自動提案effect | 親再描画でcallbackが変わると同じ入力を再送した | Job履歴の増殖、待機、提案の信頼低下 | 入力revisionと送信済みrevisionを記録し、AppでJobをrevisionへ対応付ける | 修正済み・検証中 |

## 証跡・検証

- 変更前/変更後screenshot: 安全なmock fixtureで、変更前は同じ編集に対してJobが複数表示され、変更後は1件だけであることを目視確認した。PR本文へ添付する。ユーザーの入力・画像・API keyは写していない。
- test / trace / 手動確認: `make client-test`（11 passed）、`make client-typecheck`、`make client-lint`、Pythonのlint/typecheck/test/build（44 passed）、client buildを通過。隔離mock環境で、自動提案回帰と既存core workflowのPlaywright E2E 2件が通過した。
- 取得できなかった証跡と理由: 標準E2Eは既存local serverが標準portを使用中のため起動できなかった。別port・新規mockデータの同等E2Eで代替した。実OpenAI APIはテストで呼ばない方針のため未確認。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実APIでの生成 | テストで実APIを呼ばないポリシー | API遅延時のcopy表示はmockと異なる可能性 | CI後に明示opt-inの実環境確認を別途実施 |
| 狭幅の視覚検証 | 本Issueのreflow修正ではない | status折返しの実機差 | Issue #20の狭幅証跡で確認 |

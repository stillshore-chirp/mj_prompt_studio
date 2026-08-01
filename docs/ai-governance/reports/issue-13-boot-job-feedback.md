# UI/UXレビュー報告: Issue #13 起動とJobの状態・回復feedback

## 概要

- 対象Issue / PR / 作業: [#13](https://github.com/stillshore-chirp/mj_prompt_studio/issues/13) / PR作成前 / bootとJobの状態・失敗・回復feedback
- 画面・component・状態: boot loading/error/retry、footer status、Jobs。queued/running/succeeded/failed/cancelled、cancel/retry。
- 判定: 修正前 Fail（P0） / 修正後 Pass（残る実API確認は別スコープ）
- P0 / P1 / P2件数: 既知P0を1件修正 / 新規0件 / 新規0件

## ユーザー価値

- 対象、文脈、目的、支援task: ローカルappを開き、AI Jobの実行結果を待つ利用者が、処理対象・進行・失敗の影響を理解して次の行動を決める。
- 助ける理解・判断・行動・回復: 起動失敗なら再試行・接続設定確認へ進み、Jobなら待機・取消・再試行・結果確認を安全なcopyと状態色以外の表示で選べる。
- UIがなければ困る点 / 削る候補: 常に緑の状態印と非表示errorでは、成功と失敗を誤認し、データが失われたか・何をすべきか判断できない。安全な詳細とlive regionは削れない。
- 検証仮説（未計測なら明記）: 処理対象・状態・影響・回復が一貫して見えれば、待機中の不安と失敗後の再入力・再起動を減らせる。実利用者評価は未計測。

## 初見・state matrix

- 画面目的、現在地、最初の行動、結果予測、回復: 起動中は接続を待ち、起動失敗なら原因種別を読み、再試行または接続設定確認を選ぶ。Jobsでは状態と操作を読み、待機中は取消、失敗時は再試行、取消済みは必要なときだけ元の操作をやり直す。

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| boot loading | 起動中と接続待機 | workspaceを読み込み中 | 待つ | load完了 | `role=status` | component/E2E | Pass |
| boot network error | 安全な原因、影響、再試行、設定確認 | workspace未読込、ユーザーdata未表示 | 再試行 / 接続設定確認 | 再接続 | `role=alert` | component test / screenshot | Pass |
| queued | 待機中、取消操作 | まだ処理を開始していない | 待つ / 取り消す | 取消または実行 | status textと操作label | component test | Pass |
| running | 実行中、取消操作 | 処理中である | 待つ / 取り消す | 取消または完了 | status textと操作label | component test | Pass |
| succeeded | 完了、結果確認の説明 | 対象画面で結果を確認できる | 結果を確認 | 既存の結果導線 | status text | component test | Pass |
| failed | 安全な原因、影響、再試行 | 結果は適用されていない | 再試行 / 設定確認 | retry | `role=status`、error text | component/E2E / screenshot | Pass |
| cancelled | 取消済み、結果未適用 | 処理を止めた | 必要なら元操作を実行 | 元操作 | status text | component test | Pass |
| footer status | 状態別のicon/text | 色だけに依存しない | messageに従う | 画面内操作 | `role=status`、`aria-live=polite` | component/E2E | Pass |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: 実装後にlive region、Jobの状態名、cancel/retryのaccessible name、boot回復buttonのkeyboard操作、error読み上げを確認する。
- 視覚階層（主操作、grouping、密度、狭幅）: footerの状態印を状態別にし、error detailと回復操作をJobカードへ近接表示する。狭幅reflowはIssue #20で扱う。
- copy（用語、error、空、disabled、tone、禁止表記）: backend error原文を出さず、原因種別・影響・回復をユーザーの言葉で示す。
- 熟練者効率（手数、保持、近道）: cancel/retryをJob行へ維持し、失敗時に原因を探す往復を減らす。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: statusの成功色誤用をやめ、失敗・取消で結果が適用されないことを明示する。
- 反証レビュー: error原文の露出、success色の残存、Job状態の混同、retry/cancelのkeyboard名欠落、起動失敗で画面が行き止まりになる状態を確認する。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P0 | boot / footer / Jobs | 起動失敗で復帰できず、状態印は常に成功色、Job error detailは非表示、live regionがない | 失敗・待機・成功を誤認し、回復行動を選べない | boot recovery、状態別status、Jobの安全な状態copyと操作を実装 | 修正済み |

## 証跡・検証

- 変更前/変更後screenshot: `origin/main`と変更後を安全なAPI failure fixtureで取得し、前はproduct名だけで復帰不能、後は原因・影響・再試行・設定確認を表示することを目視確認した。failed Jobも安全fixtureで取得した。PR本文へ添付する。ユーザー入力・画像・API keyは写していない。
- test / trace / 手動確認: API failure mock、Job failure/cancelled component test、keyboard accessible name、lint/typecheck/build、隔離E2E 5件を実行した。
- 取得できなかった証跡と理由: 標準E2Eのport 8765は既存ローカルserverが使用中のため、利用者processを停止せず別port 5773/9376で同等のE2Eを実行した。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実OpenAI API | テストで実APIを呼ばないポリシー | 実API遅延・失敗時のmessage差 | 明示opt-inの実環境確認を別途実施 |
| 実ユーザー評価 | まだ実施していない | copy理解度は未計測 | 後続のユーザー評価で確認 |
| 独立Codex CLI review | 3経路で内部runtime errorにより結論が返らなかった | 独立レビューの機械的な追加確認なし | GitHub review 0件・GraphQL未解決thread 0件、current agentの差分/画面/テスト反証でP0/P1なしを確認 |

## PR・CI・review 完了記録

- PR: [#32](https://github.com/stillshore-chirp/mj_prompt_studio/pull/32) は2026-08-01にmainへマージされた。Issue #13は自動クローズされた。
- CI: branch push、PR、main merge後の各CIは成功した。
- Review: GitHub reviewは0件、GraphQL `reviewThreads`は0件。独立Codex CLI reviewは内部runtime errorで結論を返せなかったため、実行済みのstate matrix、前後/failed Job画面証跡、component/E2E、差分反証を代替証跡とする。

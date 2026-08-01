# Issue #28 Jobsの復帰効率 UI/UXレビュー

## 概要

- 対象Issue / PR / 作業: #28 / 作業中 / JobsPanel
- 画面・component・状態: footerのAI処理、queued・running・failed・cancelled・succeeded、filter、詳細、空、絞り込み結果なし、大量履歴、狭幅
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象、文脈、目的、支援task: 反復してAI処理を使う制作者が、待機・失敗・取消済みの処理を成功履歴から即座に識別し、対象を確認して取消・再試行・再実行を判断する。
- 助ける理解・判断・行動・回復: 状態ごとの優先表示、件数付きfilter、必要時だけ開く安全な詳細、状態に応じた取消・再試行を近接させる。
- UIがなければ困る点 / 削る候補: 成功履歴の横並びが主作業を覆い、失敗や実行中のJobを探すために横スクロールと記憶が必要になる。生のerror・snapshot全文は機微情報を含み得るため表示しない。
- 検証仮説（未計測）: 対応が必要なJobを先頭に絞ることで、復帰操作までの探索を1画面内に収められる。

## 初見・state matrix

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| 通常 | 対応対象の件数、状態別filter、優先順のcard | 先に対処すべきJobが分かる | 詳細、取消、再試行、filter | filter変更・状態更新 | `group`、`aria-pressed`、live summary | unit / E2E | Pass |
| 読み込み / running | 実行中cardを最上位、取消操作 | 実行中で結果未適用、必要なら止められる | 取消す / 更新 | 状態更新 | 状態文とvisible label | E2E fixture | Pass |
| 空 | AI支援実行後にここで確認できる説明 | 履歴がない理由と次行動 | AI支援を実行 | 状態更新 | region内の本文 | browser確認 | Pass |
| 絞り込み結果なし | 条件不一致と別状態選択の説明 | 履歴が消えたのではなくfilter条件 | 別filterを選択 | filter変更 | live list | unit | Pass |
| error / failed | 失敗card、影響、再試行、詳細の安全な概要 | 結果未適用、入力・接続確認後に再試行できる | 再試行する | 詳細確認、再試行 | visible label、status、expanded | unit / E2E / screenshot | Pass |
| cancelled | 取消済みcard、未適用、再実行案内 | 結果未適用、元操作を再実行できる | 元の画面で再実行 | filter変更 | visible label、status | unit | Pass |
| 狭幅 | 既存の1列reflow内でfooterを縦配置 | 主操作とfilterへ到達できる | filter・詳細・復帰 | 通常の画面scroll | native button / reflow | 全E2Eの狭幅検証 | Pass |
| 文字拡大 | 既存の125%相当reflowでfooter内容を保持 | 状態と操作を読める | filter・詳細・復帰 | 通常の画面scroll | native button / reflow | 全E2Eの文字拡大検証 | Pass |
| 長文・大量data | 完了は初期5件、残件表示、詳細時だけfooterを拡張 | 成功履歴で主作業を恒常的に覆わず、全件へ戻れる | 残件を表示 / 詳細 | 5件表示へ戻す | count label、scroll可能なlist | unit / E2E / screenshot | Pass |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: filterはnative buttonと`aria-pressed`、詳細は`aria-expanded`/`aria-controls`、取消・再試行はicon-onlyではない文字labelにした。E2Eで完了filterへのfocus + Enterを確認した。
- 視覚階層（主操作、grouping、密度、狭幅）: 対応対象を既定、running→queued→failed→cancelled→succeededの順とし、成功は5件までに抑える。詳細を開いた時だけfooterを拡張して情報を切らないことを視覚確認した。
- copy（用語、error、空、disabled、tone、禁止表記）: 「対応対象」「処理中」「失敗」「取消済み」「完了」で状態を明示し、失敗では影響（未適用）と回復（確認後の再試行）を示す。backendの生errorとinput snapshotの値は表示しない。
- 熟練者効率（手数、保持、近道）: 対応対象は初期表示から1操作で詳細・取消・再試行へ到達し、完了履歴は必要時だけ展開する。filter切替時は詳細を閉じて現在対象を混同させない。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: 待機・実行中・失敗・取消済み・完了の影響を区別し、再試行対象と取消対象を状態に応じて限定した。外部送信・永続データの仕様変更はない。
- 反証レビュー: 実装後の最初の視覚確認で詳細がfooter内で切れるP1を検出し、詳細時だけ表示領域を拡張して修正した。履歴は非表示ではなくfilter/段階的開示で全件到達可能、選択状態は色に加え`aria-pressed`と文字で伝わる。P0/P1は残らない。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P1 | 詳細展開 | 初回実装ではfooter内で詳細が切れた | 対象・失敗概要を読めない | 詳細時だけfooterを拡張 | 修正済み |

## 証跡・検証

- 変更前/変更後screenshot: 安全なmockの空状態と、E2E fixtureの多数履歴・失敗詳細状態を目視確認した。機微なprompt、画像、API key、実運用識別子を含まないことを確認し、PR本文へ添付する。
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（36件）、`make e2e`（19件）、`make client-build`、`git diff --check`、`bash scripts/verify-ai-governance.sh` が成功。ブラウザで空状態とfilter、fixture screenshotで失敗詳細の展開を確認した。実API・実ユーザーdataは使用していない。
- 取得できなかった証跡と理由: 実ユーザーテスト、実OpenAI API、実運用履歴は実施していない。ローカルmockと安全なE2E fixtureまでの確認であり、実利用時の履歴量・操作頻度は後続観測が必要。

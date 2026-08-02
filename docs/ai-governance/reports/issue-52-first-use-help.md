# Issue #52 初見利用者向け制作フローと文脈連動ヘルプ UI/UXレビュー

## 概要

- 対象Issue / PR / 作業: #52 / 作業中 / 初見導線、目的中心ナビゲーション、右下Markdownヘルプ
- 画面・component・状態: App Shell、Composer、Free Editor、Reference Library、Matrix Lab、Result Review、Settings、`ScreenGuide`、`HelpWidget`
- 判定: PASS（push / PR CI / review待ち）
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象、文脈、目的、支援task: 初めて開いた利用者が、画像生成用Promptを作る場所、外部サービスへ手動で生成を依頼する境界、結果を見直す場所を判断できるようにする。
- 助ける理解・判断・行動・回復: 左の「制作の流れ」、各画面先頭の目的・使う場面、Composerの3段階案内で最初の行動を明示する。作業中に迷った場合は右下「使い方」から目次、文書切替、現在画面の節へ移動できる。
- UIがなければ困る点 / 削る候補: 旧来の英語機能名と空の入力欄だけでは画面の目的、開始順、外部生成との役割分担が分からない。任意ローカルMarkdown読込はパス公開・未信頼HTML・読込失敗の面積を増やすため追加しない。
- 検証仮説（未計測）: 目的中心ラベルと画面内ガイドにより、初見の人が画面を往復して機能を推測する手数を減らせる。実ユーザー評価は未実施。

## 初見・state matrix

| 状態 | 見えるもの | 理解 | 次action / 回復 | a11y・証跡 | 判定 |
|---|---|---|---|---|---|
| 初回Composer | 制作の流れ 1/5、画面目的、3段階案内、`AI Briefを入力する` | Prompt作成→外部で手動生成→結果見直しの境界 | CTAでAI Briefへfocus。左の制作の流れで補助画面へ移る | 見出し、native button、focus unit/E2E、変更後screenshot | PASS |
| 補助画面 | 目的、使う場面、主操作・既存空状態 | 既存Prompt整形、参考画像、比較、結果見直し、設定の用途 | 既存の入力・追加・AI Plan・Import・設定操作へ進む | 各画面見出しのunit test、既存action E2E | PASS |
| ヘルプ閉 | 右下の常設`使い方`button | 作業を閉じずに支援を開ける | buttonでpanelを開く | `aria-expanded`、`aria-controls`、E2E | PASS |
| ヘルプ開 | 非modalの右下panel、文書tab、目次、現在画面button | 同梱Quick Startとマニュアルを選べる | 目次・文書tab・現在画面へのジャンプ。Escapeで閉じる | panel titleへfocus、Escape後に起点へ復帰、E2E | PASS |
| ヘルプ文書切替 | tabと関連付けたtabpanel | 文書選択状態と内容が一致する | clickまたは矢印/Home/Endで切替 | `tablist` / `tab` / `tabpanel`、keyboard unit test | PASS |
| 760px幅 / 125%相当 | 1列化したpanel、画面幅に収まるヘルプ | ラベルを失わず主作業・補助情報へ到達できる | 横scrollなしで開閉・閲覧できる | narrow / text zoom E2E | PASS |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: ヘルプはnative buttonで開閉し、open時に見出しへfocus、Escapeで閉じて起点へ復帰する。文書選択は`tablist`、`tab`、`tabpanel`をIDで関連付け、矢印/Home/Endで切り替える。既存のmain tabと主要操作のkeyboard導線を維持した。
- 視覚階層（主操作、grouping、密度、狭幅）: 左側はフルの目的名、上部tabは短い動詞、各画面はフルの目的名と説明を示す。これにより1440px幅でも全画面へ直接到達できる。右下panelは主作業を閉じずに一時的に重なる。
- copy（用語、error、空、disabled、tone、禁止表記）: 「作る」「整える」「参考画像」「比較」「見直す」の目的語を先に示し、外部画像生成サービスは手動操作であることを明記した。特定の画像生成サービスのversion表記は追加していない。
- 熟練者効率（手数、保持、近道）: 既存のtab keyboard、保存/Compile/copy shortcut、各画面の通常操作は維持する。ヘルプは必要時だけ右下から開くため、常時の作業領域を縮めない。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: AI keyがなくてもMock LLMで画面導線を試せると明記する。ヘルプは信頼済み同梱MarkdownだけをReact要素として表示し、任意HTML・任意ローカルファイル・外部送信を行わない。
- 反証レビュー: 長い目的名で上部tabが隠れる問題を確認し、上部は短い動詞、左側と画面見出しはフルの目的名に分離した。ヘルプがmodal化して主作業を遮る、Escape後にfocusを失う、文書tabをkeyboard操作できない、狭幅で横overflowするケースを検証した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P0 | 旧App Shell | 画面名と空入力だけでは初見の目的・開始順・外部生成境界を判断できない | 作業開始不能、誤った期待 | 目的中心ナビゲーション、画面ガイド、初回3段階案内、文脈ヘルプ | 対応済み |
| P1 | 上部tab | フルの目的名と技術名を並べると一部画面が画面幅外へ隠れる | 画面到達性低下 | 短い動詞へ圧縮し、フル名称を左導線・画面見出し・accessible nameで保持 | 対応済み |

## 証跡・検証

- 変更前/変更後screenshot: [変更前Composer](../evidence/issue-52/before-composer.png)、[変更後Composer](../evidence/issue-52/after-composer.png)、[変更後ヘルプpanel](../evidence/issue-52/after-help-panel.png)。安全なMock fixtureだけで撮影し、API key、個人情報、ユーザーprompt、画像、ローカルpathがないことを目視した。PNGはprofileなしで確認した。
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（15 files / 47 tests）、`make client-build`がPASS。隔離Mockで`MJPS_E2E_API_PORT=8871 MJPS_E2E_CLIENT_PORT=5181 make e2e`を実行し、21 testsがPASS。1440px幅で変更前/後とhelp open、760px幅と125%相当のreflowを確認した。
- 取得できなかった証跡と理由: 実OpenAI API、実ユーザーdata、実ユーザー評価は対象外。安全なMock UI・文書表示・状態遷移だけを確認した。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実ユーザー評価 | ローカル開発タスクで、ユーザー資産を扱わないため | 説明量・用語の理解度は未計測 | 任意の匿名初見評価で確認する |

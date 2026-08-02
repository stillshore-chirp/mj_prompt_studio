# Issue #67 AIジョブ失敗の分類と復旧導線 UI/UXレビュー

## 概要

- 対象Issue / PR / 作業: #67 / 作業中 / LLM failure boundary、JobsPanel、Settings、App status
- 画面・component・状態: ComposerのAI Brief構造化を含む全AI Job、接続テスト、Jobs footer、失敗詳細、再試行、Settings導線、狭幅
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象、文脈、目的、支援task: AI Briefの構造化などが失敗した制作者が、入力を失わず、何が起きたかと次の一手をその場で理解して復帰する。
- 助ける理解・判断・行動・回復: 安全な原因分類、結果未適用、待機・再試行・Settingsへの遷移を失敗の種類に応じて区別する。接続テストの成功を構造化Jobの成功保証と誤認させない。
- UIがなければ困る点 / 削る候補: 原因不明の汎用エラーだけでは、API key、権限、応答保存、schema、利用上限、ネットワークを区別できず、利用者が同じ操作を繰り返す。provider原文を出す案は秘密情報・入力・識別子を露出し得るため採用しない。
- 検証仮説（未計測）: 原因・影響・次actionを1枚のJob cardへ置くことで、失敗後に対象画面とSettingsを往復せず復帰操作を選べる。

## 初見・state matrix

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| API key未設定・初期化・認証・権限 | 安全な原因、未適用、Settings、再試行 | keyまたは利用権限の確認が必要 | 設定を開く | key適用後に明示再試行 | `role=status`、native button | unit / client test | Pass |
| 利用上限・実API一時障害 | 原因、未適用、待機案内。再試行ボタンは出さない | 直ちに繰り返すべきではない | 少し待つ | 元操作を再実行 | visible copy、ボタン不在 | client test | Pass |
| ネットワーク | 原因、未適用、ネットワーク確認と再試行 | 接続を確認してから復帰する | 再試行する | 入力を保持 | `role=status`、native button | unit / E2E fixture | Pass |
| 応答保存・構造化schema・構造化応答 | 原因、未適用、Privacy modeまたはアプリ更新の案内 | 接続テストだけでは判定できない失敗 | Settingsまたは更新後に再試行 | 入力を保持 | 詳細に原因 / 次にできること | provider fake / snapshot | Pass |
| 実APIリクエスト・未分類 | 安全な定型文、未適用、再試行またはSettings案内 | 生エラーを見せず安全に復帰する | 再試行する | 入力を保持 | DTOと画面にraw detailなし | unit / API test | Pass |
| 既存の失敗履歴（codeなし） | 未分類の安全な案内 | 旧履歴でも復帰方法がある | 設定確認または再試行 | 新しい失敗は分類される | nullable code | client test | Pass |
| 取消済み | 結果未適用、元操作の再実行案内 | AI処理を停止した | 元の操作へ戻る | 新規Job | visible copy | existing E2E | Pass |
| 狭幅・固定ヘルプ | footerの右端アクションとヘルプが重ならない | 詳細・再試行を押せる | 詳細 / 再試行 | 通常scroll | native button、横overflowなし | E2E / screenshot | Pass |

## 品質確認

- accessibility: Jobsの状態文は`role=status`、詳細は`aria-expanded`/`aria-controls`、復旧操作は文字を伴うnative buttonにした。E2EでキーボードによるJobs filterと詳細確認、再試行ボタンのpointer操作を確認した。
- 視覚階層: 失敗の短い要約をcard本文へ置き、詳細で「原因」「次にできること」を分離した。右下ヘルプが復旧操作を覆う状態を検出後、footerに余白を確保した。
- copy: 接続テストはAPI keyと基本接続だけを検査し、構造化Job・response storageの成功保証ではないとSettingsとマニュアルに明記した。エラー原文、入力本文、API key、response IDを出さない。
- 熟練者効率: 再試行は入力を保持し、失敗cardから明示的に開始する。待機すべき失敗には再試行を出さず、操作の繰り返しを抑える。
- 満足感・信頼感: 結果が適用されていないことを一貫して明示し、Settingsが必要な場合だけ導線を出す。構造化schemaを送信前に検証し、失敗原因を早く確定できるようにした。
- 反証レビュー: 初回の安全fixture screenshotで、固定ヘルプがJob右端の再試行に重なるP1を検出した。desktop footerの右余白と狭幅footerの下余白を追加し、fixtureの実クリックと再撮影で解消を確認した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P1 | 失敗Job card右端 | 固定「使い方」が再試行を覆い得た | 失敗から復帰できない | footerの安全領域を確保し、E2Eで再試行を実クリック | 修正済み |

## 証跡・検証

- 変更前: [`before-generic-job-failure.png`](../evidence/issue-67/before-generic-job-failure.png) — 安全fixtureで、汎用エラーと重なった再試行を確認。
- 変更後: [`after-structured-output-recovery.png`](../evidence/issue-67/after-structured-output-recovery.png) — 構造化schema失敗を原因別に表示し、詳細・再試行を押せることを確認。
- test / trace / 手動確認: Python unit/API fake、client unit、mock E2E、React production build、Strict Structured Outputsの全Agent送信前schema検証を実行。実API・実ユーザー入力・実画像は使っていない。
- 取得できなかった証跡と理由: 既に失敗した実API Jobのprovider原文は、旧実装が記録していないため復元不能。新実装は以後の失敗を安全な分類で記録する。実APIの個別原因と実利用時の利用上限・権限は、API keyを使う明示的な手動確認が必要。

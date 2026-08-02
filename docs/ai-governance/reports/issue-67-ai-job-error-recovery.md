# Issue #67 AIジョブ失敗の分類と復旧導線 UI/UXレビュー

## 概要

- 対象Issue / PR / 作業: #67 / #68と追加修正PR / LLM failure boundary、JobsPanel、Settings、App status
- 画面・component・状態: ComposerのAI Brief構造化を含む全AI Job、接続テスト、Jobs footer、失敗詳細、再試行、Settings導線、狭幅
- 判定: Pass（追加修正のローカル実装・視覚証跡。PR CI・reviewは完了ゲートとして別途監視）
- P0 / P1 / P2件数: 1 / 0 / 0（P0は追加修正・視覚確認済み）

## ユーザー価値

- 対象、文脈、目的、支援task: AI Briefの構造化などが失敗した制作者が、入力を失わず、何が起きたかと次の一手をその場で理解して復帰する。
- 助ける理解・判断・行動・回復: 安全な原因分類、結果未適用、待機・再試行・Settingsへの遷移を失敗の種類に応じて区別する。接続テストの成功を構造化Jobの成功保証と誤認させない。
- UIがなければ困る点 / 削る候補: 原因不明の汎用エラーだけでは、API key、権限、応答保存、schema、利用上限、ネットワークを区別できず、利用者が同じ操作を繰り返す。provider原文を出す案は秘密情報・入力・識別子を露出し得るため採用しない。
- 検証仮説（未計測）: 原因・影響・次actionを1枚のJob cardへ置くことで、失敗後に対象画面とSettingsを往復せず復帰操作を選べる。

## 初見・state matrix

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| API key未設定・初期化・認証・権限 | 安全な原因、未適用、Settings、再試行 | keyまたは利用権限の確認が必要 | 設定を開く | key適用後に明示再試行 | `role=status`、native button | unit / client test | Pass |
| 利用枠・請求上限 | 原因、未適用、OpenAI Platformでの利用枠・請求状態確認、再試行 | 待機だけでは回復しない | 利用枠または請求状態を確認する | 更新後に同じJobを明示再試行 | `role=status`、native button | provider fake / client test | Pass |
| 一時的なリクエスト制限・実API一時障害 | 原因、未適用、待機案内。再試行ボタンは出さない | 直ちに繰り返すべきではない | 少し待つ | 元操作を再実行 | visible copy、ボタン不在 | client test | Pass |
| ネットワーク | 原因、未適用、ネットワーク確認と再試行 | 接続を確認してから復帰する | 再試行する | 入力を保持 | `role=status`、native button | unit / E2E fixture | Pass |
| 応答保存・構造化schema・構造化応答 | 原因、未適用、Privacy modeまたはアプリ更新の案内 | 接続テストだけでは判定できない失敗 | Settingsまたは更新後に再試行 | 入力を保持 | 詳細に原因 / 次にできること | provider fake / semantic validation test | Pass |
| 実APIリクエスト・未分類 | 安全な定型文、未適用、失敗段階、診断情報コピー | 原因を断定できず、同じ操作を繰り返すべきでない | 診断情報を確認・報告 | アプリ側の確認後に新規実行 | DTOと画面にraw detailなし | unit / API / client test | Pass |
| 固定モデル不在・非対応parameter | 固定モデルまたはAPI契約の不一致、再試行なし | Settingsでは直せないアプリ側の問題 | 診断情報を確認・報告 | アプリ更新後に新規実行 | allowlist済みprovider code | client test | Pass |
| 既存の失敗履歴（codeなし） | 原因を復元できないこと、再試行なし | 旧履歴だけでは判断できない | 更新・再起動後に新しく1回実行 | 新しい失敗で診断情報を取得 | nullable code、copyからID・入力除外 | client / E2E fixture | Pass |
| Clipboard失敗 | 読み取り専用の安全な診断情報 | 自動コピーだけが失敗した | 手動選択・コピー | 同じ診断内容を共有できる | label、readonly textarea、focus時select | client test | Pass |
| 取消済み | 結果未適用、元操作の再実行案内 | AI処理を停止した | 元の操作へ戻る | 新規Job | visible copy | existing E2E | Pass |
| 狭幅・固定ヘルプ | footerの右端アクションとヘルプが重ならない | 詳細・再試行を押せる | 詳細 / 再試行 | 通常scroll | native button、横overflowなし | E2E / screenshot | Pass |

## 品質確認

- accessibility: Jobsの状態文は`role=status`、詳細は`aria-expanded`/`aria-controls`、復旧操作は文字を伴うnative buttonにした。E2EでキーボードによるJobs filterと詳細確認、再試行ボタンのpointer操作を確認した。
- 視覚階層: 失敗の短い要約をcard本文へ置き、詳細で「原因」「次にできること」を分離した。右下ヘルプが復旧操作を覆う状態を検出後、footerに余白を確保した。
- copy: 接続テストはAPI keyと基本接続だけを検査し、構造化Job・response storageの成功保証ではないとSettingsとマニュアルに明記した。エラー原文、入力本文、API key、response IDを出さない。
- 熟練者効率: 再試行は入力を保持し、原因が判定済みで回復条件を満たせる失敗だけに出す。一時的なリクエスト制限・一時障害、診断情報のない旧履歴、原因未分類、固定モデル不在・非対応parameterには再試行を出さず、操作の繰り返しを抑える。安全な診断情報は1操作でコピーできる。
- 満足感・信頼感: 結果が適用されていないことを一貫して明示し、Settingsが必要な場合だけ導線を出す。構造化schemaを送信前に検証し、失敗原因を早く確定できるようにした。
- 反証レビュー: 初回の安全fixture screenshotで、固定ヘルプがJob右端の再試行に重なるP1を検出した。desktop footerの右余白と狭幅footerの下余白を追加し、fixtureの実クリックと再撮影で解消を確認した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P1 | 失敗Job card右端 | 固定「使い方」が再試行を覆い得た | 失敗から復帰できない | footerの安全領域を確保し、E2Eで再試行を実クリック | 修正済み |
| P1 | HTTP 429の失敗分類 | 利用枠・請求上限を一時的なリクエスト制限と同じ待機案内にしていた | 待機してもAPI利用を回復できない | providerの安全な`error.code`/`error.type`で利用枠・請求上限を区別し、確認後の再試行を案内 | 修正済み |
| P1 | RateLimitErrorの早期判定 | SDK例外名だけで一時的な制限へ分類し、利用枠・請求上限のcode/typeを読む前に戻っていた | 利用枠切れでも待機だけを案内する | RateLimitError形状でも安全なcode/typeを先に判定し、SDK例外名を再現したテストで固定 | 修正済み |
| P1 | schema後の意味検証 | 要求モード不一致や文字数上限未達のschema-valid応答がValueErrorで汎用失敗に落ちていた | 構造化出力の問題なのに原因と復旧案内が不正確になる | 型付きの`structured_output_invalid`へ変換し、Job Queue・意味検証の回帰テストで固定 | 修正済み |
| P0 | PR #68後の実画面・codeなし失敗 | 詳細を開いても原因、失敗段階、HTTP状態がなく、根拠なく設定確認と再試行を勧めていた | 利用者が原因を調査できず、同じ失敗を繰り返す | 新規失敗へ安全な診断fieldを追加。旧履歴は復元不能と明示して再試行を抑止し、安全な診断コピーを追加 | 追加修正・視覚確認済み |

## 証跡・検証

- 変更前: [`before-generic-job-failure.png`](../evidence/issue-67/before-generic-job-failure.png) — 安全fixtureで、汎用エラーと重なった再試行を確認。
- PR #68時点: [`after-structured-output-recovery.png`](../evidence/issue-67/after-structured-output-recovery.png) — 構造化schema失敗の原因別表示。追加修正では、アプリ更新前の根拠のない再試行を抑止する設計へ更新した。
- 変更後（利用枠・請求上限）: [`after-quota-recovery.png`](../evidence/issue-67/after-quota-recovery.png) — 安全fixtureで、待機だけにせず、利用枠・請求状態の確認と同じJobの再試行を表示。右下ヘルプが復旧操作を覆わないことを確認。
- 追加修正後（安全な診断概要）: [`after-safe-diagnostics.png`](../evidence/issue-67/after-safe-diagnostics.png) — 固定モデル不在の安全fixtureで、汎用設定案内ではなく原因と診断コピーを表示し、再試行を出さないことを確認。
- 追加修正後（詳細と再試行判断）: [`after-safe-diagnostics-recovery.png`](../evidence/issue-67/after-safe-diagnostics-recovery.png) — Job内スクロール後に、失敗段階、HTTP状態、allowlist済みproviderコード、原因、次にできること、再試行判断を確認。
- test / trace / 手動確認: Python unit/API fake、client unit、mock E2E 25件、React production build、Strict Structured Outputsの全Agent送信前schema検証を実行。実API・実ユーザー入力・実画像は使っていない。
- 失敗分類の根拠: OpenAI公式の[Error codes](https://developers.openai.com/api/docs/guides/error-codes#api-errors)に従い、HTTP 429では`error.code`/`error.type`を用いて利用枠・請求上限と一時的なリクエスト制限を分離する。
- 取得できなかった証跡と理由: 既に失敗した実API Jobのprovider原文は、旧実装が記録していないため復元不能。新実装は以後の失敗を安全な分類で記録する。実APIの個別原因と実利用時の利用上限・権限は、API keyを使う明示的な手動確認が必要。
- 追加修正の確認済み自動検証: Python 89件、client 59件、mock Chromium E2E 27件。新規失敗の段階・HTTP状態・allowlist済みproviderコード、旧履歴の再試行抑止、安全なコピーとClipboard失敗時の手動コピー、狭幅・文字拡大を含む。実APIは未使用。

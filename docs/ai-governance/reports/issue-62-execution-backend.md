# Issue #62 UI/UXレビュー報告

## 概要

- 対象Issue / PR / 作業: #62 / 実行バックエンドの明示化とAPI key未設定時の回復導線
- 画面・component・状態: Settings、Composerのstatus、AI Inspector、Jobs。実API利用可、明示的Mock、API key未設定、接続失敗、Job完了・失敗を対象とした。
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象、文脈、目的、支援task: AI支援を実行しようとする利用者が、実際にどの経路で実行されるかを確認し、未設定なら安全にSettingsへ戻れる。
- 助ける理解・判断・行動・回復: 「実API」「明示的Mock」「利用不可」を分け、Mock成功を実API成功と誤認させない。未設定時は入力を失わせず、statusの`設定を開く`から設定画面へ移動できる。
- UIがなければ困る点 / 削る候補: backendと応答ID種別を隠すと、固定モデル表示だけから実行経路を誤認する。API key値、実Response ID、provider例外原文は表示しない。
- 検証仮説（未計測なら明記）: 明確なバックエンド名と次の行動により、未設定状態からの設定復帰が迷わずできる。定量利用データは未計測。

## 初見・state matrix

- 画面目的、現在地、最初の行動、結果予測、回復: SettingsはAI支援の設定と実行経路の確認画面である。初見では実行状態を読んでAPI keyを適用または保存済みkeyを読み込み、実API利用不可なら安全な理由を見て設定を変更できる。Job詳細では作成時の設定モード、実行経路、キー設定有無、応答種別を確認する。
- `templates/state-matrix.md` の結果:

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| 実API利用可 | 実APIの設定モード・バックエンド・キー設定済み | 実行可能な経路が分かる | 接続テストまたはAI実行 | 接続失敗は安全な理由を表示 | label付きkey入力、button | API/Component test | Pass |
| 明示的Mock | Mockは明示設定、外部API未送信、接続テスト無効 | 実API成功ではないと分かる | 開発確認を続けるか再起動してMock解除 | 誤って接続成功を表示しない | disabled button、説明文 | `settings-after-explicit-mock.png` | Pass |
| API key未設定 | statusの安全な理由と`設定を開く` | Job未作成で入力は保たれる | Settingsを開く | key適用後に再実行 | `role=status`、button名 | `api-key-missing-recovery.png`、E2E | Pass |
| 接続失敗 | 認証・network・rate limit等の安全な理由 | キー値やprovider詳細を見ずに再試行判断できる | 設定確認または再試行 | 入力を変更しない | `role=status` | unit/API contract test | Pass |
| Job完了（明示的Mock） | 実行経路、設定モード、key設定有無、応答種別 | 実モデル未呼出しと分かる | 結果を確認 | 実APIへ誤認しない | 詳細buttonの`aria-expanded` | `job-explicit-mock.png` | Pass |
| Job失敗 | 影響と再試行導線 | 結果未適用と分かる | 再試行または設定確認 | backend例外原文を表示しない | status、操作名 | component/E2E test | Pass |
| 狭幅 | SettingsとAI状況へ到達可能 | 横overflowしない | 通常操作 | 同一の設定導線 | tab/button keyboard操作 | `narrow-layout-reflow.spec.ts` | Pass |
| 文字拡大 | SettingsとAI状況へ到達可能 | 重要情報が隠れない | 通常操作 | 同一の設定導線 | semantic controls | `text-zoom-reflow.spec.ts` | Pass |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: API key入力にlabelと説明を維持し、接続テストは実API利用可かつkey設定済みの場合だけ有効にした。復帰操作には明示的なbutton名、statusにはライブ通知を使う。Job詳細は開閉状態を`aria-expanded`で公開する。
- 視覚階層（主操作、grouping、密度、狭幅）: API key操作、現在の実行状態、Privacyを同じSettings内で分け、Jobの安全情報は詳細を開いたときだけ表示する。
- copy（用語、error、空、disabled、tone、禁止表記）: 「Mock」「実API」「実行不可」を一貫して使い、秘密情報や実Response IDを出さない。固定モデルをMockの実行済み表示には使わない。
- 熟練者効率（手数、保持、近道）: 環境変数・OS資格情報ストアは起動時に解決し、未設定時は同じ画面からSettingsへ直接戻れる。入力値はエラー時に破棄しない。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: Mockを実API成功として扱わず、接続テストも成功表示しない。実行経路と応答種別は安全な値だけで説明する。
- 反証レビュー: 実APIキー、Token、Cookie、Prompt全文、実Response ID、provider例外原文がSettings、Health、Jobs、スクリーンショットに露出しないことをAPI/Clientテストと画面証跡で確認した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| — | — | 検出なし | — | — | — |

## 証跡・検証

- 変更前screenshot: [`settings-before.png`](../evidence/issue-62/settings-before.png) — main `06d200d` の明示的Mock Settings。
- 変更後screenshot: [`settings-after-explicit-mock.png`](../evidence/issue-62/settings-after-explicit-mock.png) — 明示的Mockと接続テスト無効の説明。
- 実行プロファイルscreenshot: [`settings-after-execution-profile.png`](../evidence/issue-62/settings-after-execution-profile.png) — 実行経路、設定モード、API key設定有無、取得元、資格情報ストア、実モデル未呼出しを安全な値だけで表示。
- 回復screenshot: [`api-key-missing-recovery.png`](../evidence/issue-62/api-key-missing-recovery.png) — 安全な409 fixtureからのSettings復帰導線。
- Job screenshot: [`job-explicit-mock.png`](../evidence/issue-62/job-explicit-mock.png) — Mockで実モデル未呼出し、作成時の設定モード・キー設定有無・応答種別を確認。
- test / trace / 手動確認: `make lint`、`make typecheck`、`make test`、`make build`、`make client-lint`、`make client-typecheck`、`make client-test`、`make client-build`、`make generate-openapi`、`make e2e`、`make verify-governance`、`git diff --check`。E2Eは隔離localhostの明示的Mockで23件成功。
- 取得できなかった証跡と理由: API keyを用いる実OpenAI API smokeは未実行。通常CIで外部APIを呼ばない方針であり、ユーザーの明示opt-inと一般入力が必要。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実API資格情報による接続テスト | ユーザーのAPI key・外部送信を使う明示承認がない | provider認証・networkの実環境結果は未確認 | 承認済みの一般入力で手動smokeを実施 |

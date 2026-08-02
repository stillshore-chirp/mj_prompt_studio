# Issue #52 初見利用者向け制作フローと文脈連動ヘルプ

## Issue

- Issue: #52

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / コピー / 状態・エラー・待機 / 文書

## 目的

- 初見利用者が、プロンプト作成、外部サービスでの手動生成、生成結果の見直しという制作フローを理解し、各画面の目的と最初の行動を選べるようにする。
- 右下の折りたたみ式ヘルプから、Quick StartとユーザーマニュアルのMarkdownを読み、目次または現在画面に対応する節へ移動できるようにする。

## 非目標

- 画像生成サービスの自動操作、ログイン、Cookie・Tokenの取得。
- 実ユーザーデータをヘルプ内へ埋め込むこと。
- 実ユーザーテスト結果の断定。

## 対象範囲

- App Shellの目的中心ナビゲーション、初回制作フロー、各主要画面の目的・使いどころ・次行動。
- 同梱Markdownを表示するヘルプwidget、文書選択、見出し目次、画面別節ジャンプ。任意ファイル読込を行わないため、実行時のloading/error/retry状態は対象外。
- client tests/E2E、ユーザーマニュアル、Quick Start、UI仕様、UI/UXレビュー報告。

## マイルストーン

- [x] 制作フローと各画面の導線を実装する。
- [x] 右下ヘルプwidgetと安全なMarkdown表示を実装する。
- [x] 状態・アクセシビリティ・狭幅のテストと文書を更新する。
- [ ] UI/UX証跡、全品質ゲート、PR/CI/reviewを完了する。

## 受け入れ条件

- [ ] 初回のComposerで、作成、手動生成、見直しの流れと最初の行動が分かる。
- [ ] 各主要画面に目的、使う場面、主操作または次の行動が表示される。
- [ ] ヘルプは右下の常設buttonからmodalではなくpanelとして開閉できる。
- [ ] Quick StartとユーザーマニュアルをMarkdown表示でき、目次・節ジャンプ・現在画面へのジャンプが動く。
- [x] ヘルプは信頼済み同梱文書だけをbuild時に取り込み、任意ファイルの読込失敗を発生させない。
- [ ] keyboard、focus、accessible name、狭幅・長文を自動テストまたは手動確認で検証する。

## 検証コマンド

- `make lint`
- `make typecheck`
- `make test`
- `make build`
- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`
- `make generate-openapi`
- `bash scripts/verify-ai-governance.sh`

## 既知 blocker

- 隔離ブラウザのPlaywright実行ファイルがローカルにない場合、safe Mockの画面証跡取得は代替方法を確認する。

## 仮定・未確認事項

- Quick Startとユーザーマニュアルをアプリ同梱ヘルプの対象とする。任意のローカルMarkdownファイルを開く機能は、パス公開と任意file読込を避けるため対象外とする。
- ヘルプのMarkdownは信頼済みの同梱文書だけを表示し、HTMLは解釈しない。

## UI/UX 証跡

- 保存先: `docs/ai-governance/reports/issue-52-first-use-help.md`
- 安全なMock入力のみを使う。API key、ユーザーprompt、画像、local path、追跡IDを含めない。
- 初見、state matrix、a11y、前後screenshot、反証レビューを記録する。

## feature flag / rollback

- 変更は通常のgit revertで戻せる単位にまとめる。永続化や外部送信の追加は行わない。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `make client-lint` / `make client-typecheck` / `make client-test` / `make client-build` | Pass | 15 files / 47 tests。右下ヘルプの文書tab keyboard操作を含む。 |
| 2026-08-02 | `MJPS_E2E_API_PORT=8871 MJPS_E2E_CLIENT_PORT=5181 make e2e` | Pass | 既存利用中の8765/5173を止めず、隔離Mockで21 scenariosを実行。 |
| 2026-08-02 | 変更前後のMock screenshot確認 | Pass | 1440pxのComposer前後・help open、760px/125%相当のreflowを確認。 |

## PR / CI / review 記録

- Branch: `codex/first-use-help`
- Commit: 未作成
- PR: 未作成
- Push CI: 未実行
- PR CI: 未実行
- Codex review: 未実行
- 未解決 review thread: 未確認
- レビュー往復回数: 0

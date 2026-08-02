# Issue #50: 保存済みOS資格情報ストアからAPI keyを再読み込みする

## Issue

- Issue: https://github.com/stillshore-chirp/mj_prompt_studio/issues/50

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / コピー / 状態・エラー・待機 / backend / 文書

## 目的

Settingsから、既にOS資格情報ストアへ保存したOpenAI API keyを、値を再入力・表示せずに現在のセッションへ適用できるようにする。

## 非目標

- 資格情報ストアの保存方式や既存依存の変更
- API keyの表示、export、HTTP responseやログへの返却
- 実OpenAI APIや実環境の資格情報を使った接続確認

## 対象範囲

- SecretStoreのkeyring専用読み込み
- AppContext / Settings API / typed client / SettingsView
- backend契約・単体テスト、frontend unit/E2E
- user manual、quick start、UI/UX report

## マイルストーン

- [x] 既存実装、Issue、UI/UX・公開安全性ルールを確認する
- [x] keyringから安全に読み込むbackend契約を追加する
- [x] Settingsの読み込み操作、状態、a11y、copyを追加する
- [x] テスト、OpenAPI、関連docs、UI/UX証跡を更新する
- [ ] 品質ゲート、commit、push、Ready PR、CI、review状態を確認する

## 受け入れ条件

- [x] 保存済みkeyring値がある場合、値をUIへ返さず現在のセッションへ適用できる
- [x] 未発見・利用不可・読み込み失敗時は既存セッションを変更せず原因と次行動を示す
- [x] API keyがDOM、API response、ログ、test artifact、screenshotへ含まれない
- [x] キーボードで操作でき、loading/disabled/statusがaccessibleに通知される
- [x] mock、未設定、成功、未発見/利用不可、失敗の状態をテストとstate matrixで確認する
- [x] 関連lint、typecheck、test、build、E2E、contract、公開安全性確認が成功する

## 検証コマンド

- `make lint`
- `make typecheck`
- `make test`
- `make build`
- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make generate-openapi`
- `make e2e`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`
- `python scripts/verify_ui_text.py`

## 既知 blocker

- 実OSのcredential backend動作と実OpenAI APIは通常テストの対象外。

## 仮定・未確認事項

- `keyring`が提供するOS資格情報ストアを「OS側の設定」として扱い、環境変数とは別の明示操作にする。
- 実macOS Keychain、Windows Credential Manager、Linux Secret Serviceでの手動取得成功は未確認とし、keyringをモックした契約で検証する。

## UI/UX 証跡

- 保存済み値なし、読み込み中、読み込み成功、未発見/利用不可、既存設定保持をstate matrixへ記録する。
- 初見理解、a11y、視覚階層、copy、効率、信頼、反証レビューを `docs/ai-governance/reports/issue-50-os-keychain-api-key.md` に記録する。
- before/afterはAPI key未入力の安全なmock状態で取得し、PR本文へ添付する。

## feature flag / rollback

- feature flagは追加しない。変更は通常のgit revertで戻せる単位にまとめる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `gh auth status -h github.com`（制限外） | 成功 | PR/CI操作に使える認証を確認 |
| 2026-08-02 | `git fetch origin` / `git merge --ff-only origin/main` | 成功 | mainは最新。mergeはsandbox制限外で実行 |
| 2026-08-02 | `make lint` / `make typecheck` / `make test` / `make build` | 成功 | Ruff、mypy、Python 47 tests、compileall |
| 2026-08-02 | `make client-lint` / `make client-typecheck` / `make client-test` / `make client-build` | 成功 | client 42 testsを含む |
| 2026-08-02 | `make generate-openapi` / `git diff --check` / `.venv/bin/python scripts/verify_ui_text.py` / `bash scripts/verify-ai-governance.sh` | 成功 | OpenAPI、公開安全性に関わる静的確認 |
| 2026-08-02 | 隔離mock E2E（8769 / 5182、20 tests） | 成功 | 標準portは既存プロセス占有のため、proxyを含む一時設定で実行。初回はproxy先誤りで1件失敗後、修正して全20件成功 |
| 2026-08-02 | safe mock Settings before/after screenshot | 成功 | API key、prompt全文、画像、local path、ユーザー情報なし。sRGB metadataのみ |

## PR / CI / review 記録

- Branch: `codex/os-keychain-api-key`
- Commit:
- PR:
- Push CI:
- PR CI:
- Codex review:
- 未解決 review thread:
- レビュー往復回数: 0

## Issue

- Issue: `#62` — 実API利用を期待する起動でもMockLLMへフォールバックし、実行状態を誤認させる

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / 状態・エラー・待機 / backend / API / LLM / セキュリティ / 文書

## 目的

- API keyの実際の解決結果に基づいて実行バックエンドを確定し、実API利用不能を正常なMock成功として扱わない。利用者がSettings、Health、Jobsから実行経路と安全な回復方法を確認できるようにする。

## 非目標

- 固定LLM実行ポリシーの変更、通常CIでの実OpenAI API実行、API keyの平文保存、ユーザーが選べるモデル切替の追加。

## 対象範囲

- Runtime/AppContext: 環境変数・OS資格情報ストアを解決後に実行モードを決定し、明示的なMock以外で暗黙フォールバックしない。
- LLM/Job/API: backend・安全なresponse ID識別・型付き設定不足/初期化失敗をHealth、Settings、Jobへ一貫して返す。
- Client: Mock、実API利用可、設定不足、接続失敗を区別し、Settingsへ戻れる導線とJobsの矛盾しない表示を提供する。
- Tests/docs/evidence: unit・API contract・client/E2E・UI/UX report・前後スクリーンショットを追加/更新する。

## マイルストーン

- [x] 現行の設定解決、Orchestrator、Job/API、Settings/Jobs UIと既存テストを棚卸しする。
- [x] 実行バックエンドのドメイン契約、API key解決、暗黙Mockフォールバック廃止を実装・unit検証する。
- [x] Health/Settings/Jobs APIとclientの表示・回復導線を実装し、OpenAPIを再生成する。
- [x] 正常、明示Mock、API key未設定、初期化/接続失敗、狭幅、文字拡大をテストとUI/UX証跡で確認する。
- [ ] 全品質ゲート、公開安全性、Ready PR、push/pull_request CI、Codex reviewと未解決review thread確認を完了する。

## 受け入れ条件

- [ ] 環境変数なし・OS資格情報ストアにAPI keyありで起動直後から `execution_backend=openai` になる。
- [ ] 実API経路の診断情報からMockでない実行を確認でき、キーや秘密情報は露出しない。
- [ ] API keyなしの通常起動はMock結果ではなく、設定不足エラーとSettingsへの回復導線を示す。
- [ ] `MJPS_LLM_MODE=mock` を明示した場合だけMockを実行し、Settings/JobsでMockと確認できる。
- [ ] Mockの接続テストは成功扱いにならず、実行バックエンドと矛盾するモデル表示をしない。
- [ ] Health、Settings、JobのAPI契約が実行バックエンドと安全なresponse ID識別を返す。
- [ ] API key、token、prompt全文、実response IDを画面、HTTPレスポンス、Job snapshot、ログ、証跡へ含めない。

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
- `make verify-governance`
- `git diff --check`

## 既知 blocker

- 実OpenAI APIのcredentialed smokeは通常CIと分離する。実APIの呼び出しは、ユーザーの明示opt-inと安全な一般入力がある場合だけ実行する。

## 仮定・未確認事項

- OS資格情報ストアの実キーは読み取らず、keyringをスタブ化した契約テストで起動判定を検証する。
- UI証跡はMockモードと安全なfixtureのみを用い、API key、ユーザーPrompt、実response IDを表示しない。

## UI/UX 証跡

- 保存先: `docs/ai-governance/evidence/issue-62/` と `docs/ai-governance/reports/issue-62-execution-backend.md`
- 対象: SettingsのMock/実API利用可/API key未設定・接続失敗表示、Jobsの実行バックエンド表示、狭幅・文字拡大状態。

## feature flag / rollback

- feature flagは追加しない。設定・実行経路・表示を責務ごとのコミットに分け、通常のgit revertで復旧できるようにする。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `make lint && make typecheck && make test && make build` | Pass | ruff、mypy、pytest 70件、compileall。実APIは未呼出し。 |
| 2026-08-02 | `make client-lint && make client-typecheck && make client-test && make client-build` | Pass | ESLint、TypeScript、Vitest 15 files / 51 tests、Vite build。 |
| 2026-08-02 | `make generate-openapi` | Pass | API contractを再生成して確認。 |
| 2026-08-02 | `make client-lint && make client-typecheck && make client-test && make client-build` | Pass | SettingsのAPI key設定有無・安全な取得元表示を追加後、Vitest 15 files / 51 tests。 |
| 2026-08-02 | `make verify-governance && git diff --check` | Pass | governance verificationとdiff whitespaceを確認。 |
| 2026-08-02 | UI証跡の目視確認 | Pass | 変更前、明示的Mock、API key未設定の回復、Mock Jobを安全なfixtureで撮影。 |
| 2026-08-02 | push CI `30749082551` | Fail | E2E 21/23。Mockを実モデルとして期待する古いparityと、未保存draftを保護するSettings復帰確認が失敗。 |
| 2026-08-02 | `make client-lint && make client-typecheck && make client-test && make client-build` | Pass | CI failureのE2E期待値修正後、Vitest 15 files / 51 tests。 |
| 2026-08-02 | `MJPS_E2E_API_PORT=18062 MJPS_E2E_CLIENT_PORT=18063 make e2e` | Pass | 隔離localhost、明示的Mock、Chromium 23件。sandbox port bind制限後に制限外で実行。 |

## PR / CI / review 記録

- Branch: `codex/issue-62-execution-backend`
- Commit: `735bd574b9be025eb7fa45f515db7bc41bb2698a`（CI修正コミットは作成予定）
- PR: `https://github.com/stillshore-chirp/mj_prompt_studio/pull/65`
- Push CI: `30749082551` failed（E2E期待値を修正して再push予定）
- PR CI:
- Codex review:
- 未解決 review thread:
- レビュー往復回数: 0

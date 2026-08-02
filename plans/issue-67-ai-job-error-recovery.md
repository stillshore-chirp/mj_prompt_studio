# Issue #67 AIジョブ失敗の分類と復旧導線を改善する

## Issue

- Issue: [#67](https://github.com/stillshore-chirp/mj_prompt_studio/issues/67)

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / コピー / 状態・エラー・待機 / backend / 文書

## 目的

AI支援操作が失敗しても、利用者が対象操作、原因カテゴリ、入力・既存データへの影響、次の安全な回復操作を理解し、入力を失わずに明示的に再試行できるようにする。構造化AIジョブと接続確認の検証範囲を区別し、原因不明の汎用表示だけに依存しない。

## 非目標

- API key、入力本文、画像、生のproviderエラー、応答IDを画面、API DTO、ログ、Issue、PR、fixtureへ出すこと。
- 固定LLM実行ポリシーの変更。
- ユーザー操作なしの自動再試行、または通常テストでの実API呼出し。

## 対象範囲

- OpenAI Responses API例外と構造化出力検証例外の安全な分類。
- Jobの失敗情報、再試行可否、UI向け回復案内を保持・公開する契約。
- Jobs panelと失敗通知の詳細・再試行・設定確認導線。
- AI Brief構造化を含む全AI Jobの失敗UI、backend/client/E2Eテスト、UI/UX証跡、関連文書。

## マイルストーン

- [x] 既存のprovider境界、Job永続化、Jobs panel、テストと実行記録を棚卸しし、分類・DTO・UI状態を設計する。
- [x] provider例外・構造化出力失敗を安全な失敗分類へ変換し、Jobへ再試行可否と回復情報を記録する。
- [x] Jobs panelと失敗通知に原因・影響・復旧操作を実装し、アクセシビリティと入力保持を検証する。
- [x] 構造化AI Jobのリクエスト契約を検証し、観測済み失敗に対する回帰をフェイク境界で固定する。
- [x] docs、UI/UX state matrix、前後スクリーンショット、ローカル検証、PR/CI/reviewを完了する。
- [x] Codex review P1: HTTP 429の利用枠・請求上限と一時的なレート制限を分離し、復旧操作を正しく案内する。
- [x] Codex review P1（再指摘）: RateLimitError形状のHTTP 429でも、先に利用枠・請求上限を判定して復旧案内を選ぶ。
- [x] Codex review P1（再指摘）: schemaに通った応答でも、アプリケーションの意味検証に失敗したら構造化出力の復旧案内へ分類する。

## 受け入れ条件

- [x] API key未設定、初期化、認証、利用上限、ネットワーク、providerリクエスト、構造化出力、キャンセルを安全な原因カテゴリへ分ける。
- [x] 失敗UIが対象操作、影響、次の回復操作を表示し、入力・既存文書が変更されなかったことを伝える。
- [x] 再試行可能なJobは入力を失わず、明示操作だけで再実行できる。再試行すべきでない失敗は理由に応じた設定確認または待機を案内する。
- [x] 接続確認の対象範囲と構造化AI Jobとの差を誤認させない。
- [x] 機微情報がJob DTO、画面、テスト、ログ、公開証跡に含まれない。
- [x] backend、client、E2Eで通常・失敗・再試行・設定確認・狭幅・キーボードを検証する。
- [x] 関連文書、UI/UXレビュー、前後スクリーンショット、Issue、Ready PR、CI、review threadsを完了する。
- [x] HTTP 429のうち利用枠・請求上限は待機だけを案内せず、利用枠・請求状態の確認後に明示再試行する導線を出す。
- [x] RateLimitError形状の利用枠・請求上限も、一時的なリクエスト制限へ誤分類しない。
- [x] 要求モード、除外語句、文字数上限などのLLM出力意味検証失敗を、汎用失敗へ誤分類しない。

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
- `git diff --check`

## 既知 blocker

- 実APIの元例外は現状のJob記録から復元できない。通常テストではフェイクproviderで分類を固定し、実API固有の再確認は明示opt-inの手動確認として分離する。

## 仮定・未確認事項

- provider SDKの例外型・HTTP statusを安全な原因カテゴリへ正規化できる。
- 未知のproviderエラーは、生エラーを露出せず原因未分類として再試行・設定確認・待機の安全な案内へ落とす。

## UI/UX 証跡

- `docs/ai-governance/reports/issue-67-ai-job-error-recovery.md` にstate matrix、初見、a11y、反証レビュー、前後スクリーンショット、実行・未実行検証、残リスクを記録する。

## feature flag / rollback

- feature flagは追加しない。変更は通常のgit revertで復元できる単位にまとめる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | 実行中アプリの安全な状態確認 | Pass | 実APIバックエンドと失敗Jobを確認。API key、入力本文、生エラー、識別子は記録しない。 |
| 2026-08-02 | `make generate-openapi && make lint && make typecheck && make test && make build` | Pass | lint、mypy、pytest 77件、compileall。実APIは未使用。 |
| 2026-08-02 | `npm run lint && npm run typecheck && npm run test:run && npm run build` | Pass | client lint、TypeScript、Vitest 54件、production build。 |
| 2026-08-02 | `npm run e2e` | Pass | mock専用のChromium E2E 24件。構造化失敗fixture、再試行の実クリック、狭幅reflowを含む。視覚証跡は匿名化済みのdocs evidenceとして別途確認。 |
| 2026-08-02 | `bash scripts/verify-ai-governance.sh && git diff --check` | Pass | ガバナンス検査と差分空白検査。 |
| 2026-08-03 | `make lint && make typecheck && make test && make build` | Pass | ruff、mypy、pytest 83件、compileall。実APIは未使用。 |
| 2026-08-03 | `make client-lint && make client-typecheck && make client-test && make client-build` | Pass | client lint、TypeScript、Vitest 54件、production build。 |
| 2026-08-03 | 別ポートの `npm run e2e` | Pass | mock専用のChromium E2E 25件。ユーザー起動中アプリやOS資格情報ストアの状態に依存しない。 |
| 2026-08-03 | `make lint && make typecheck && make test && make client-lint && make client-typecheck && make client-test && make client-build && make generate-openapi && bash scripts/verify-ai-governance.sh && git diff --check` | Pass | ruff、mypy、pytest 86件、client lint/TypeScript/Vitest 54件、production build、OpenAPI生成、ガバナンス・空白検査。実APIは未使用。 |
| 2026-08-03 | 別ポートの `make e2e` | Pass | mock専用のChromium E2E 25件。利用枠切れの復旧カードを含む。 |
| 2026-08-03 | `make lint && make typecheck && make test` | Pass | ruff、mypy、pytest 88件。schemaに通るが意味検証に失敗する応答を、構造化出力の安全な復旧分類へ変換する回帰を含む。実APIは未使用。 |
| 2026-08-03 | 別ポートの `make e2e` | Pass | mock専用のChromium E2E 25件。構造化出力・利用枠切れの復旧カードを含む。ユーザー起動中アプリには未干渉。 |

## PR / CI / review 記録

- Branch: `codex/issue-67-ai-job-error-recovery`
- Commit: `cc1f005`、`8bcaec1`、`153ca44`、`d1e5642`、`8c48b92`、完了記録はコミット前
- PR: [#68](https://github.com/stillshore-chirp/mj_prompt_studio/pull/68) (Ready)
- Push CI: `8c48b92`で成功（Quality and package、macOS、Windows）
- PR CI: `8c48b92`で成功（Quality and package、macOS、Windows）
- ローカル差分レビュー: Pass（P0 / P1 なし）
- Codex review: `8c48b92`を再レビュー済み（重大な問題なし）
- 未解決 review thread: 0
- レビュー往復回数: 3

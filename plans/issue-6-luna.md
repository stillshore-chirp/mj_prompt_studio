# Issue #6: GPT-5.6 Luna High 固定化

## 目的

全 OpenAI Responses API 経路を `gpt-5.6-luna` / reasoning `high` / text verbosity `low` に固定し、モデル選択・低推論設定・旧設定が新規実行へ影響する経路を廃止する。

## 非目標

- 旧 Job 履歴のモデル・推論強度を書き換えること。
- GPT-5.6 Luna 以外へのフォールバックやユーザー選択機能を追加すること。
- CI から OpenAI 実 API を呼ぶこと。
- Midjourney 本体を自動操作すること。

## 対象範囲

- Python の設定、LLM client/orchestrator/job、Application Service、PromptDocument 継続状態。
- SQLite に保存された旧機能別プロファイルの冪等移行。
- FastAPI Settings 契約、OpenAPI、React TypeScript 型、Settings/Jobs UI。
- Python/API/React/E2E の回帰テスト。
- README、architecture、LLM agents、quick start、user manual、UI spec、security の整合。

## 前提と仮定

- 固定実行ポリシーを Python 設定モジュールの唯一の正本とし、公開設定/API/UIはその値を読み取り専用で参照する。
- 旧 `llm_feature_profiles` のキー名は保存データ移行の入口としてだけ読み、正規化後は vocabulary 設定だけを保存する。
- 実 API スモークは API キーが利用可能な場合のみ実施し、秘密情報や本文を記録しない。利用不能時は Blocked として理由と再開条件を記録する。
- Issue の受け入れ条件を満たしたため、PR は Ready で作成する。未解決の設計判断が発生した場合のみ Draft を再検討する。

## マイルストーン

- [x] Task 1: 現行設定・LLM・永続化・API・UI・テストの依存経路を棚卸しする。
- [x] Task 2: 固定実行ポリシー、OpenAI client、Orchestrator、Job、継続レスポンス境界と観測情報を実装する。
- [x] Task 3: 保存済み機能別設定を vocabulary-only 契約へ冪等移行する。
- [x] Task 4: Settings API、OpenAPI、TypeScript 型、Settings/Jobs UI を新契約へ移行する。
- [x] Task 5: Python/API/React/E2E 回帰テストと旧参照残存検査を完成させる。
- [x] Task 6: README と関連 docs を更新し、全品質ゲート・package・実 API smoke を実施する（実APIのみキー不在でBlocked、他はDone）。
- [ ] Task 7: cohesive な日本語コミット、push、Ready PR、push/PR CI 監視、Issue 完了を行う。

## 受け入れ条件

- [x] 全 Responses API 呼び出しが `gpt-5.6-luna`、reasoning `high`、text verbosity `low` を明示する。
- [x] `reasoning.mode`、`temperature`、旧モデル slug を新規実行ペイロードへ送らない。
- [x] モデルと推論強度を呼び出し側、環境変数、保存設定、API、UIから変更できない。
- [x] 旧プロファイルから vocabulary を保持し、旧 model/reasoning を除く冪等移行ができる。
- [x] 旧/不明モデルの `previous_response_id` は切断し、Luna の通常モードだけ継続する。
- [x] Structured Outputs、画像入力、Privacy mode、MockLLM、retry、Job Queue が維持される。
- [x] 新規 Job と結果が Luna / High / Low verbosity を記録する。
- [x] 利用量、レイテンシ、再試行、schema成否、画像有無、response ID有無を秘密情報なしで観測できる。
- [x] 公開設定と Settings UI は固定構成を読み取り専用表示し、語彙量だけ変更できる。
- [x] Python、API、React、E2E、OpenAPI同期、package、旧参照残存検査が通る。
- [x] README と関連 docs が実装に一致し、実 API smoke 結果または明確な Blocked 理由を PR に記録する。

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
- `make package`
- `python scripts/verify_ui_text.py`
- `git diff --check`
- 旧モデル・旧設定シンボルの `rg` 残存検査
- opt-in 実 API smoke（APIキー利用可能時のみ）

## 既知 blocker

- `gh auth status` は sandbox 内で Keychain 制約または無効トークン表示となった。push/PR 前に sandbox 外で再確認する。
- 実API smoke: `OPENAI_API_KEY` とOS資格情報ストアのどちらにもキーがないため Blocked。再開条件は有効なAPIキーをセッションまたは環境変数へ設定すること。次の最短アクションは `docs/llm-agents.md` の12ケースをopt-inで実行し、usage/latency/schema結果をPRへ追記すること。

## feature flag / rollback

- Mock/real モード、Privacy mode、timeout/retry の既存切替は維持する。
- モデル固定化に feature flag は設けない。変更はマイルストーン別コミットを通常の `git revert` で戻せるようにする。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-01 | `git status --short --branch` | Done | `main...origin/main`、作業ツリー clean |
| 2026-08-01 | Issue #6 取得 | Done | GitHub connector で本文・受け入れ条件を確認 |
| 2026-08-01 | `gh --version` | Done | gh 2.92.0 |
| 2026-08-01 | `gh auth status` (sandbox) | 要再確認 | Keychain 制約またはトークン無効表示。公開前に sandbox 外で確認 |
| 2026-08-01 | `make lint` | Done | ruff: All checks passed |
| 2026-08-01 | `make typecheck` | Done | mypy: 49 source files、問題なし |
| 2026-08-01 | `make test` | Done | pytest: 42 passed |
| 2026-08-01 | `make build` | Done | compileall成功 |
| 2026-08-01 | `make client-lint` | Done | ESLint成功 |
| 2026-08-01 | `make client-typecheck` | Done | TypeScript成功 |
| 2026-08-01 | `make client-test` | Done | Vitest: 4 files / 6 tests passed |
| 2026-08-01 | `make client-build` | Done | Vite production build成功 |
| 2026-08-01 | `make generate-openapi` | Done | committed schemaを新API契約へ同期 |
| 2026-08-01 | `make e2e` | Done | sandbox外でPlaywright Chromium 1 passed |
| 2026-08-01 | `make package` | Done | sandbox外でsdist/wheel build成功 |
| 2026-08-01 | `.venv/bin/python scripts/verify_ui_text.py` | Done | 禁止UI表記なし |
| 2026-08-01 | 旧モデル・旧設定シンボル残存検索 | Done | runtime/UI/現行docsに旧slugなし。READMEの旧環境変数警告のみ |
| 2026-08-01 | `git diff --check` | Done | whitespace errorなし |
| 2026-08-01 | opt-in実API smoke | Blocked | APIキー不在。再開条件と12ケースを上記に記録 |

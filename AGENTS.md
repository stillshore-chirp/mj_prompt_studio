# AGENTS.md

このファイルは Codex が最初に読む入口文書である。OpenAI Codex の既定読み込み上限を避けるため、32KiB 未満を維持する。詳細ルールは `docs/process/` 配下へ分割する。

## 最優先ルール

コード、設定、テスト、ドキュメントを編集する場合は、タスク規模に関わらず次を必ず行う。

1. 作業前にこの `AGENTS.md` を読む。
2. `git status --short --branch` で作業ツリーと現在ブランチを確認する。
3. `main` / `master` 上なら `codex/<task>` ブランチを作成してから編集する。
4. 進捗を `plans/<task-id>.md` または作業チェックリストで管理する。長大タスクと `/goal` は必ず `plans/TEMPLATE.md` を使う。
5. 編集前に、対象に応じて下記の詳細文書を読む。
6. 編集後は関連する lint / typecheck / test / build を実行する。
7. 日本語コミットメッセージでコミットする。
8. push して PR を作成する。受け入れ条件を満たす場合は Ready PR、未解決の設計判断やリスク共有が必要な場合だけ Draft PR とする。
9. push と pull_request の CI/checks をどちらも完了まで監視し、`success` / `skipped` / `neutral` 以外を残して完了扱いにしない。
10. 最終報告には PR URL、ブランチ、コミット、検証結果、未解決リスクを含める。

例外は、ユーザーが明示的に「編集のみ」「コミット不要」「PR不要」「CI監視不要」と指示した場合、または認証・権限・外部障害で実行不能な場合だけである。例外時も理由、未コミット差分、再開条件、次の最短アクションを報告する。

## 詳細ルールの参照先

- 汎用の長大タスク運用、コミット、文書、設計原則、テスト、依存管理: `docs/process/agent-general-rules.md`
- MJ Prompt Studio 固有の仕様、UI表記、LLM、Ruleset、Reference、Result Review、Matrix、Storage、Security、品質ゲート: `docs/process/mj-prompt-studio-rules.md`
- 長大タスクの実務手順: `docs/process/task-execution.md`
- CI の実行内容: `docs/process/ci.md`
- アーキテクチャ: `docs/architecture.md`
- LLM Agent 仕様: `docs/llm-agents.md`
- Ruleset / Capability Profile: `docs/rulesets.md`
- セキュリティ: `docs/security.md`
- UI 仕様: `docs/ui-spec.md`

## 作業開始チェック

- 作業ディレクトリ、直近の git 履歴、作業ツリー、未完了 checklist、起動・検証コマンドを確認する。
- 長大タスクでは `plans/<task-id>.md` に `目的`、`非目標`、`対象範囲`、`マイルストーン`、`受け入れ条件`、`検証コマンド`、`既知 blocker`、必要なら `feature flag / rollback` を記録する。
- 合理的に前進できる不明点は停止理由にせず、仮定として plan または作業メモへ記録して進める。
- 破壊的変更、外部依存、権限不足、要件衝突、秘密情報不足は停止条件になり得る。停止時は Done / Blocked / Cancelled を整理する。

## コミットとPR

- コミットメッセージは必ず日本語で簡潔に書く。
- 1コミットに独立した複数関心事を混在させない。
- WIP、壊れた状態、未接続の仮実装だけを残すコミットは避ける。
- 通常 PR は受け入れ条件を満たしてから Ready で作成する。
- Draft PR は、ユーザー指定、Codex app 設定、またはレビュー待ちの設計判断・リスク共有が必要な場合だけ使う。
- CI が失敗した場合はログを確認し、原因を記録し、修正、検証、コミット、push、再監視を成功まで繰り返す。

## 検証方針

- 既存の `Makefile` または `scripts/` の入口を優先する。
- Python 変更の標準入口は `make lint`、`make typecheck`、`make test`、`make build`。
- Client 変更では `make client-lint`、`make client-typecheck`、`make client-test`、`make client-build`、必要に応じて `make e2e`。
- LLM 呼び出しを含むテストでは OpenAI 実 API を叩かない。モック、フェイク、契約テストで境界を固定する。
- 永続化変更では新規作成、更新、削除、再起動後復元、破損データ時の表示を確認する。
- UI 変更では操作導線、空状態、エラー状態、長文入力、保存復元、アクセシビリティラベルを確認する。

## ドキュメント更新

- 実装、挙動、セットアップ、アーキテクチャ、設計を変更したら `README.md` の更新要否を確認する。
- `docs/` 配下の関連文書を確認し、現状とずれていれば同じ変更内で更新する。
- UI 文言を追加・変更した場合は、特定の Midjourney バージョン番号がユーザー可視領域に出ていないか確認する。
- LLM Agent を追加・変更した場合は、schema、モック、失敗時挙動、ログの秘匿性、関連 docs を確認する。

## コーディング原則

- 既存パターン、フレームワーク、ローカル helper API を優先する。
- DRY、KISS、SoC、SRP、YAGNI、POLA、OCP を守る。詳細は `docs/process/agent-general-rules.md` を参照する。
- UI / Presentation、Application / Service、Domain、Infra / DB、LLM の責務を混在させない。
- PySide6 Widget や React component から OpenAI API、SQLite、生ファイル IO を直接呼ばず、Application Service 経由にする。
- 設定値は環境変数または設定モジュールへ集約し、モデル名、タイムアウト、リトライ、保存モードを UI や Agent に直書きしない。

## リポジトリ概要

- 本リポジトリは、画像生成向けプロンプト設計を支援するデスクトップアプリ `MJ Prompt Studio` を開発する。
- 主言語は Python。GUI は PySide6、LLM 連携は公式 OpenAI Python SDK と Responses API を中心に扱う。
- 永続化はローカル SQLite とファイルベースの asset store を基本とする。
- テストは pytest を基本とし、通常テストと CI では実 OpenAI API を呼ばない。
- アプリは画像生成サービス本体を自動操作しない。生成サービスへの投入はユーザーの手動コピー、手動貼り付け、手動アップロードを前提にする。

## MJ Prompt Studio 固有の禁止事項

- UI、メニュー、タブ、設定、エラー、エクスポート文書などのユーザー可視領域に、Midjourney の特定バージョン番号を表示しない。
- `Alpha`、`Current Model`、`Latest Version` など、サービス状態を誤認させる UI 表記を避ける。
- Midjourney Web、Discord、ブラウザ、Cookie、Token、非公式 API を自動操作しない。
- OpenAI API キー、ユーザーの制作プロンプト、参照画像、生成画像、ローカル DB、ログ、キャッシュを git 追跡対象にしない。
- LLM に既存データの上書きを直接許可しない。変更は `Patch`、`Suggestion`、`Review` として返し、Application Service が検証して適用する。
- ユーザー操作なしに破壊的変更を適用しない。

## 主要ディレクトリ

- `src/mj_prompt_studio/ui/`: PySide6 Widget、Window、ViewModel、Action、スタイル定義。
- `src/mj_prompt_studio/application/`: ユースケース、Application Service、コマンド、DTO。
- `src/mj_prompt_studio/domain/`: PromptDocument、PromptBlock、Parameter、Ruleset、Validation、ResultReview など。
- `src/mj_prompt_studio/infra/`: SQLite、ファイル保存、OpenAI client adapter、keyring、settings、logging。
- `src/mj_prompt_studio/llm/`: LLM Orchestrator、Agent、schema、prompt template、tool adapter。
- `tests/`: unit / integration / gui / contract test。
- `docs/`: 設計、画面仕様、LLM Agent 仕様、運用手順。
- `plans/`: 長大タスクの計画ファイル。
- `scripts/`: セットアップ、検証、ビルド、ローカル起動の共通入口。

## 品質ゲート

- UI に Midjourney の特定バージョン番号が表示されないこと。
- 画像生成サービスの自動操作、Cookie / Token 抽出、非公式 API 呼び出しが存在しないこと。
- LLM 出力が schema 検証を通り、失敗時に UI が破綻しないこと。
- OpenAI API キーやユーザー資産が git 追跡対象にならないこと。
- 主要ユースケースに Unit Test または Integration Test が存在すること。
- README と関連 docs が実装に追従していること。

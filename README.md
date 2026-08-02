# MJ Prompt Studio

MJ Prompt Studioは、画像生成向けプロンプトの設計、語彙補助、検証、参照管理、実験計画、生成結果レビューを支援するローカルアプリです。React + TypeScript client と localhost Python API で動作し、生成サービス本体の自動操作は行いません。

## 一般使用者向けガイド

- [Quick Start for Users](docs/quick-start.md): 初めて使うときの最短手順。
- [ユーザーマニュアル](docs/user-manual.md): 目的別の利用手順。

## 開発ガバナンス

- [`AGENTS.md`](AGENTS.md): 作業開始、Issue-first、PR/CI/review、MJ Prompt Studio固有制約の入口。
- [`docs/ai-governance/`](docs/ai-governance/00-index.md): UI/UX、アクセシビリティ、証跡、Issue品質、完了条件の詳細正本。
- [`docs/security-publication-checklist.md`](docs/security-publication-checklist.md): 公開文書、PR、スクリーンショット、ログ要約の安全確認。
- `make verify-governance`: ガバナンス構造と必須ゲートの検証。

ここでいうAIガバナンスは、本リポジトリ内のAIエージェント支援開発の品質管理を指し、企業全体の法務・倫理・モデル監査を意味しません。

## セットアップ

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
make client-install
```

Node.js と npm が必要です。Apple Silicon で Python の architecture mismatch が出る場合は、Terminal の Rosetta 起動をオフにするか、`arch -arm64 python3 -m venv .venv` で venv を作り直してください。`make` は `.venv/bin/python` を優先して使います。

起動時は `OPENAI_API_KEY`（互換名 `OPENAI_KEY`、`MJPS_OPENAI_API_KEY`）とOS資格情報ストアを順に解決します。APIキーが見つかれば実APIを利用し、見つからなければAI実行は開始せず、Settingsで安全な理由と設定導線を表示します。通常起動でMockLLMへ自動フォールバックすることはありません。

実APIの全機能と接続テストは、`gpt-5.6-luna`、reasoning effort `high`、text verbosity `low` の固定構成を使います。モデルと推論強度は変更できません。Settingsでは実効構成を読み取り専用で確認し、機能ごとの語彙量だけを調整できます。旧 `MJPS_MODEL_*` 環境変数は無視され、起動時に削除を促す警告が出ます。

```bash
export OPENAI_API_KEY="..."
```

明示的にサンプル応答で起動したい場合だけ、`MJPS_LLM_MODE=mock` を指定します。

## 起動

```bash
make run
```

`make run` は `http://127.0.0.1:8765` のローカルAPIと `http://127.0.0.1:5173` のReact clientを同時に起動します。APIだけ起動する場合は `make run-api`、clientだけ起動する場合は `make run-react` を使います。

## 検証

```bash
make lint
make typecheck
make test
make build
make client-lint
make client-typecheck
make client-test
make client-build
make e2e
make package
```

OpenAPI schemaを更新する場合は `make generate-openapi` を実行します。

## 主な機能

- Composer: 日本語ブリーフからPromptDocument、Prompt Blocks、Compiled Promptを作成。
- Composer: 各入力欄のAI補完、候補、専門語化、短縮、説明、入力停止後の自動提案、Undo/Redo。
- Prompt Workshop: 材料なしの複数Prompt生成、世界観整形・カオスミックス、文字数のみ調整、プリセットアレンジ、コピーとComposer取り込み。
- Prompt Doctor: 決定論的ValidatorとAIレビューで矛盾、不足、弱い語彙を検出し、確認後にPatch適用。
- Parameter Advisor: Rulesetに基づくパラメータ表示と目的別提案、確認付き適用。
- Reference Library: 参照画像を手動取り込みまたはドラッグ&ドロップし、プレビュー、ローカル画像メタデータ、用途判定、検索、タグ、語彙抽出を保存。
- Matrix Lab: 実験目的からvariantを生成し、選択コピー、一括コピー、CSV/Markdownで出力。
- Result Review: 手動取り込み画像を元プロンプトと比較し、画像プレビュー、parameters snapshot、改善候補をComposerへPatchとして戻す。
- Export: Prompt only、Markdown record、JSON snapshot、CSV/Markdown matrix variants。
- Jobs: LLM処理の状態、固定実効構成、原因別の安全な復旧案内、キャンセル、明示的な再実行を表示。
- Text output policy: Settingsで構造化オプションをテキストPromptへ含めるかを全出力で切り替え、Prompt除外語句を創作系の生成・変換へ適用。

## データとセキュリティ

- APIは既定でlocalhostにのみbindします。
- React clientはtyped API client経由でPython Application Serviceを呼びます。
- SQLite、asset store、settings、job queueが永続化の正本です。
- APIキーは環境変数を優先し、標準インストールに含まれる`keyring`を通じてSettingsから利用可能なOS資格情報ストアへ保存・再読み込みできます。資格情報ストアが使えない環境ではセッション内適用に限定します。Settings、Health、Jobsは設定モード・実行バックエンド・キー設定有無などの安全な状態だけを表示し、キーや実Response IDをclientへ返しません。
- Privacy modeではResponses APIの保存を無効化し、`previous_response_id` を送りません。
- ローカルDB、asset、cache、log、export、API response dumpはgit追跡対象にしません。

## 禁止事項

- 生成サービスのWeb、Discord、Botの自動操作。
- ログイン自動化、Cookie、Token、Session取得。
- 非公式API、自動投稿、ブラウザ自動クリック。
- ユーザー向けUIやエクスポートに特定のMidjourneyモデルバージョン番号を表示すること。

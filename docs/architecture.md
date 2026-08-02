# Architecture

## レイヤ構成

`MJ Prompt Studio` は `React UI -> Local API / Bridge -> Application -> Domain -> Infra / LLM adapter` の依存方向で構成する。

```text
React.js + TypeScript client
  -> typed API client
  -> localhost-only FastAPI bridge
  -> AppContext
  -> Application Services
  -> Domain / Infra / LLM
```

## React UI

責務:

- App Shell、タブ、左右/下部パネル、フォーム、確認ダイアログ、クリップボード、file picker / drag and dropを表示する。
- API clientを通じてApplication Serviceのユースケースを呼び出す。
- 表示中状態、入力中状態、pending patch、選択中variantなどUI状態だけを持つ。
- 永続化の正本をReact stateに置かない。

依存:

- `client/src/shared/api` のtyped API client。
- `client/src/shared/types` のAPI契約型。
- Python `infra`、SQLite、OpenAI SDKを直接呼ばない。

## Local API / Bridge

責務:

- `src/mj_prompt_studio/server/` にあるFastAPI bridgeとしてlocalhostにbindする。
- CORSはReact dev / preview originに限定する。
- `AppContext` をrequestから参照し、既存Application Serviceを呼ぶ。
- OpenAPI schemaを生成し、client型との同期を検証する。
- 画像uploadを検証し、safe asset endpointだけでpreviewを返す。

分岐条件:

- 開発時はVite dev serverから `/api` proxyで呼ぶ。
- build後のclient artifactが存在する場合はPython APIから静的配信できる。

## Application

責務:

- Composer、Reference、Matrix、Result Reviewなどのユースケースを束ねる。
- LLM出力をPatchまたはReviewとして受け取り、検証後にDomainへ適用する。
- RepositoryとAssetStoreを通じて保存する。
- Prompt Workshopの生成・変換・文字数調整・プリセットアレンジ、テキスト出力ポリシー、Exportなどの操作ポリシーを保持する。

依存:

- `domain`、`infra`、`llm`。
- ReactやHTTP固有型には依存しない。

## Domain

責務:

- `PromptDocument`、`PromptBlocks`、`PromptParameters`、`Ruleset`、`ValidationReport`。
- `ReferenceAsset` / `ResultImage` はローカル画像メタデータとAI分析結果を分けて保持する。
- Prompt Compiler、PromptOutputRenderer、Prompt除外語句の正規化・検証、プリセットcatalog、Validator、Matrix Generator。
- LLMやSQLiteに依存しない決定論的処理。

拡張ポイント:

- Ruleset JSONを増やすことでCapability Profileを差し替える。
- ValidatorはRulesetのParameterSpecとReferenceModeSpecに従う。

## Infra

責務:

- SQLite Repository、Asset Store、Settings、Secret Store、画像メタデータ抽出。
- APIキーは環境変数を優先し、利用可能な場合だけOS資格情報ストアへ保存する。
- 参照画像と生成結果画像はasset store配下へコピーし、DB recordと紐付ける。

制約:

- APIキー、ユーザー画像、DB、cache、log、exportはgit追跡対象にしない。
- asset preview endpointは既知IDだけを受け取り、任意pathを受け付けない。

## LLM

責務:

- Responses API adapter、MockLLM、Structured Outputs schema、Job Queue。
- Agent名とschemaを一致させ、schema検証後にApplicationへ返す。
- `config.py` の固定実行ポリシーを唯一の正本とし、全経路を `gpt-5.6-luna` / reasoning `high` / text verbosity `low` で実行する。
- 機能別に保存するのはモデル非依存の語彙量だけとする。旧プロファイルは起動時に語彙量だけを保持して冪等移行する。
- Responses API adapterは呼び出し側からモデルと推論強度を受け取らず、固定ポリシーからpayloadを構築する。
- PromptDocumentの継続IDは保存モデルが固定モデルと一致する場合だけ再利用する。
- token usage、request latency、画像入力数、schema成否、response ID有無を本文や秘密情報なしで記録できる。

分岐条件:

- 起動時に `OPENAI_API_KEY`、`OPENAI_KEY`、`MJPS_OPENAI_API_KEY` とOS資格情報ストアを解決し、APIキーがあれば実APIを初期化する。
- `MJPS_LLM_MODE=mock` を明示した場合だけ、APIキーがあってもMockLLMを使う。
- 通常モードでAPIキーまたは実clientを利用できない場合は `unavailable` とし、Job作成前に安全な設定誘導エラーを返す。MockLLMへはフォールバックしない。
- Privacy modeではResponses APIの保存を無効化し、会話ID継続を使わない。

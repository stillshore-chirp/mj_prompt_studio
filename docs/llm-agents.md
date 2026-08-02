# LLM Agents

## 共通方針

- すべてのAgent出力は `response_schemas.py` のJSON schemaで検証する。
- ローカルではPydantic modelでも必須fieldと主要型を検証する。
- UIはLLM結果を直接保存せず、Application ServiceがPatch、Suggestion、Reviewとして扱う。
- Patchは適用前に差分確認を必須にする。
- APIキー未設定時はMockLLMが同じschemaで応答する。
- LLM Jobは `queued`、`running`、`succeeded`、`failed`、`cancelled` の状態を持ち、UIからキャンセルと再実行を操作できる。
- 実APIの全Agent、画像入力、再試行、接続テストは `config.py` の固定実行ポリシーを参照し、`gpt-5.6-luna`、reasoning effort `high`、text verbosity `low` を使う。
- 呼び出し側はモデルと推論強度をOpenAI clientへ渡せない。`reasoning.mode`、`temperature`、別モデルへのフォールバックは送信・実装しない。
- SettingsでAgentごとに保存できるのはモデル非依存の語彙量だけとする。旧機能別プロファイルは起動時に語彙量だけを残して移行する。
- ログやJob payloadにはAPIキー、Token、Cookieを含めない。
- Prompt WorkshopのJob入力snapshotにはPrompt本文、任意ガイダンス、除外語句を保存せず、件数・文字数・設定有無などの安全なメタデータだけを残す。除外語句の文字列はログや公開用証跡に出さない。
- React UIはAgentを直接呼ばず、`/api/agents/*` または機能別endpointからJobを作成する。
- Job結果の永続化やPromptDocument更新はPython Application Service / Repositoryを通す。
- 実API経路もMockLLMと同じschemaを使う。Structured Outputs向けのJSON schemaは、objectごとに `additionalProperties: false` と必須fieldを明示する。

## Agent一覧

| Agent | 入力 | 出力 | 失敗時挙動 |
|---|---|---|---|
| IntentIntakeAgent | 日本語brief、Ruleset表示名 | intent、subject、prompt_blocks、suggested_parameters、missing_decisions | Job failedとして表示 |
| VocabularyAgent | 曖昧語、短文 | suggestions、PromptPatch案 | Patchは確認対象 |
| PromptCompilerAgent | compiled prompt、document snapshot | compiled_prompt、rationale | 決定論的compiler結果を保持 |
| PromptDoctorAgent | compiled prompt、validation report | summary、issues、patches、next_actions | Validator結果だけ表示 |
| ParameterAdvisorAgent | objective、Ruleset | profile_name、parameters、rationale | 既存parametersを保持 |
| ReferenceAnalyzerAgent | reference metadata、画像 | summary、colors、lighting、composition、mode、vocabulary | 手動取り込み素材は保持 |
| MatrixPlannerAgent | experiment objective | axes、fixed_conditions、evaluation_points | 手動軸入力に戻せる |
| ResultReviewAgent | result image、prompt snapshot | scores、strengths、issues、next_prompt_candidates | 手動レビューだけ保存 |
| FinalAuditorAgent | prompt、validation | approved、summary、warnings、patches | コピー前警告として表示 |
| PromptGeneratorAgent | 件数、カオス度、出力言語、任意ガイダンス、除外語句 | Prompt案、言語、warning | 有効な案がなければJob failed、件数不足はpartialとして表示 |
| PromptTransformAgent | 本文、整形mode、出力言語、上限、anchor、除外語句 | 整形本文、保持anchor、除外要素、warning | 除外語句・上限に違反した結果は表示・コピー・適用しない |
| PromptLengthAdjustAgent | 本文、目標文字数、上限、anchor | 調整本文、保持語句、warning | 上限超過時は最大1回だけ同一Job内で再調整し、失敗なら適用しない |
| PromptArrangeAgent | 本文、プリセット、強度、任意ガイダンス、anchor、除外語句 | アレンジ本文、適用プリセット、強度、保持anchor、warning | プリセット・強度不一致、除外語句、上限違反は適用しない |

## OpenAI Responses API

実APIモードではOpenAI Python SDKのResponses APIを使い、低レベルadapterが次の共通payloadを構築する。

```text
model: gpt-5.6-luna
reasoning.effort: high
text.verbosity: low
text.format: Agent別strict JSON Schema
```

`Privacy mode` の場合は `store=false` とし、`previous_response_id` を送らない。通常モードでも、PromptDocumentに保存されたモデルが `gpt-5.6-luna` と一致する場合だけ継続IDを送る。最初のLuna応答後にモデル、推論強度、応答詳細、response IDを更新する。

usageからinput tokens、cached input tokens、output tokens、reasoning tokensを取得し、request latency、Agent名、画像入力数、schema成否、response ID有無とともに安全な計測情報として扱う。価格はコードへ埋め込まない。Jobは固定実効構成と再試行数を履歴へ記録する。

## Job API

主なendpoint:

- `/api/agents/intent-intake`
- `/api/agents/vocabulary`
- `/api/agents/compile-review`
- `/api/agents/prompt-doctor`
- `/api/agents/parameter-advisor`
- `/api/agents/reference-analyzer`
- `/api/agents/matrix-planner`
- `/api/agents/result-review`
- `/api/agents/final-audit`
- `/api/agents/prompt-generator`
- `/api/agents/prompt-transform`
- `/api/agents/prompt-length-adjust`
- `/api/agents/prompt-arrange`
- `/api/prompt-arrange-presets`
- `/api/jobs`
- `/api/jobs/{job_id}`
- `/api/jobs/{job_id}/cancel`
- `/api/jobs/{job_id}/retry`
- `/api/jobs/stream`
- `/api/settings/feature-preferences`
- `/api/settings/text-output-options`
- `/api/settings/exclusion-terms`

SSEが使えない環境でもReact clientは1秒pollingでJob状態を更新する。

## 実API手動検証

CIではOpenAI実APIを呼ばない。納品前またはリリース前に、APIキーを設定した環境で次を確認する。

1. `OPENAI_API_KEY` またはSettingsのSession API keyを設定する。
2. `make run` でローカルAPIとReact UIを起動する。
3. `Settings`で接続テストを実行する。
4. Intent Intake、Vocabulary、Prompt Compiler、Prompt Doctor、Parameter Advisorを順に実行する。
5. Prompt Workshopでゼロ入力生成、世界観整形、カオスミックス、文字数のみ調整、LLMアレンジを1回ずつ実行し、schema・出力設定・除外語句を確認する。
6. Reference Analyzerへ画像を入力する。
7. Matrix Plannerを実行する。
8. Result Reviewへ画像を入力する。
9. Final Auditorを実行する。
10. 通常モードでLuna応答の継続を確認する。
11. 旧モデル由来response IDが切断されることを確認する。
12. Privacy modeで保存と継続IDが無効になることを確認する。
13. 各ケースのschema成否、token usage、latency、エラーをPRへ記録する。

参考にした公式ドキュメント:

- [Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)

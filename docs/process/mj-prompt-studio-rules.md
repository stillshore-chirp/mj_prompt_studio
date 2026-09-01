# MJ Prompt Studio リポジトリ固有ルール

この文書は、MJ Prompt Studioにだけ適用する開発hard gateです。共通の常時読込契約は [AGENTS.md](../../AGENTS.md)、委任・証跡・task-state・runtimeは [docs/agent-harness.md](../agent-harness.md)、task手順は該当Skillを優先します。

## 製品契約

- MJ Prompt Studioは、画像生成向けの日本語brief、prompt設計、語彙補助、検証、参照管理、実験計画、生成結果reviewを支援するlocal appです。
- UIはReact + TypeScript client、backendはlocalhost Python APIです。clientはtyped API client経由でApplication Serviceを呼び、APIは既定でloopbackだけにbindします。
- SQLite、local asset store、settings、job queueをlocal dataの正本とします。実装の責務は docs/architecture.md、ユーザー操作は docs/ui-spec.md、LLMは docs/llm-agents.md、securityは docs/security.mdを参照します。
- 生成サービス本体への投稿・生成・ログインは製品の責務外です。promptの作成・検証・copy支援、参照素材の手動取り込み、生成結果の手動reviewに限定します。
- 特定の画像生成サービスやmodel versionに固定しません。仕様差分は Ruleset / Capability Profileで表し、内部IDが必要な場合もユーザー可視領域へそのまま出しません。

## 外部サービス境界

- 画像生成サービスのWeb、Discord、browser、Cookie、Token、Session、bot、非公式APIを自動操作しません。
- 外部サービスへの投入は、ユーザーの明示的なcopy、paste、uploadを前提とします。公式ページを開く機能を追加する場合も、認証状態、DOM、session、自動投稿に触れません。
- 参照画像、生成結果画像、制作logはユーザーの明示操作でlocalへ取り込みます。外部送信の有無と対象は、機能の実行前に説明できる状態にします。

## ユーザー可視表記

- アプリ名は MJ Prompt Studio とします。
- UI、export、Markdown record、checklist、制作logに、画像生成サービスの特定version番号を表示しません。
- Alpha、Current Model、Latest Versionなど、サービスの現行状態を誤認させる表記を置きません。
- Ruleset、Capability Profile、Prompt Compatibilityなど、version非依存の表現を使います。
- 内部ruleset名やIDを表示する必要がある場合は、汎用的な表示名と安全な説明へ変換します。文字列変更時は既存の禁止表記検証を確認します。

## LLM実行契約

- LLMはResponses APIを介してApplication Serviceから呼び出します。React componentやAPI routeからproviderを直接操作しません。
- 実APIの固定実行policyは config.py の LLM_EXECUTION_POLICYを唯一の正本とし、model gpt-5.6-luna、reasoning effort high、text verbosity lowを使います。
- Agent、feature別設定、環境変数、UI、requestからmodelやreasoning effortをoverrideできる構造を追加しません。語彙量、timeout、retryなどmodel非依存の設定は契約を壊さない範囲で扱います。
- 出力はschemaと意味検証を通し、PromptDocumentなど既存dataへ直接上書きしません。変更案は Patch、Suggestion、Reviewとして返し、Application Serviceが検証してユーザー操作後に適用します。
- API error、rate limit、schema mismatch、network timeout、invalid key、cancelled jobを区別し、React clientで原因、再試行可否、offline時の制限を示します。
- 通常testとCIはmock、fake、contract testを使い、実OpenAI APIを呼びません。実APIの接続確認は明示的なmanual opt-inとproduction-investigationの証跡条件がある場合だけ実行します。
- prompt template、schema、agent policyの変更は、対応するcontract test、migration、docsの更新要否を確認します。

## Privacyとlocal asset

- API key、credential、prompt全文、参照画像、生成画像、実Response ID、DB、local pathをrepository、log、screenshot、export、公開artifactへ残しません。
- LLMへ送る情報は、ユーザー操作と機能実行に必要な最小単位へ絞ります。local assetは明示的な解析操作なしに外部へ送信しません。
- Privacy modeではResponses APIの保存を無効化し、previous_response_idを送信しません。通常modeでも継続IDはserver内部の安全なstorageに限定し、public API、Health、Jobsへ返しません。
- local asset、thumbnail、解析結果、ユーザー評価、DB recordを分離し、DBだけまたはfileだけが残る不整合を黙って無視しません。削除は確認またはUndoを伴う破壊的操作として扱います。
- .env、local DB、cache、export、asset、log、screenshot、API response dumpをgit追跡対象にしません。fixtureには実ユーザーdataを使いません。

## 構造と状態

- server/ とAPI routeはtransportと公開契約、application/はuse case・transaction・DTO、domain/は技術非依存のprompt・Ruleset・validation、infra/はSQLite・file storage・settings・keyring・OpenAI adapterを扱います。
- llm/はAgent、prompt、schema、tool adapterを扱い、UIや永続化を直接操作しません。React側は入力、状態、表示、回復を担当します。
- LLM処理、画像解析、Matrix生成などの長時間処理はJobとしてqueued、running、succeeded、failed、cancelledを明示し、UI threadをblockしません。
- 主要surfaceはComposer、Prompt Workshop、Prompt Doctor、Parameter Advisor、Reference Library、Matrix Lab、Result Review、Settings、Jobsです。新しいsurfaceでもloading、empty、error、API未設定、offline、cancelledなど該当状態を扱います。
- Matrixなどのvariant生成には上限と警告を設け、copy、export、reviewの対象をユーザーが確認できます。

## Rulesetと検証

- Ruleset / Capability Profileは対応parameter、値域、組合せ制約、UI表示可否、export可否を定義します。追加・変更ではdomain、compiler、validator、schema、UI表示のtestを確認します。
- Compiled Promptは決定論的validatorを通過した候補だけをcopy可能とし、AI候補は採用前に差分を確認できるようにします。
- API、schema、storage、job、Privacyの変更はpytestのunit / integration / contract test、必要なclient test、OpenAPI生成、関連E2Eを既存Make入口から選びます。
- UI変更はclient/AGENTS.mdとUI/UX Skillを適用し、critical flow、accessibility、状態、長文、保存復元、公開安全性を確認します。
- 起動、test、build、package、governance検証は既存のMakefile、scripts、CI入口を優先し、未実行項目と残るriskを報告します。

## 文書と完了

- setupと検証入口は README.md、設計は docs/architecture.md、操作は docs/user-manual.md / docs/ui-spec.md、LLMは docs/llm-agents.md、Rulesetは docs/rulesets.md、securityは docs/security.mdを同じ変更内で同期します。
- rule、Skill、adapter、validatorの変更は docs/agent-harness.md と docs/ai-governance/13-maintenance-policy.mdへ戻り、同じhard gateの複製を増やしません。
- secret、data integrity、公開契約、P0、必須証跡の問題、未確認のruntimeを隠して完了扱いにしません。

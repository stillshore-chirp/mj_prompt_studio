# MJ Prompt Studio リポジトリ固有ルール

この文書は、従来の `AGENTS.md` から分離した本リポジトリ固有ルールである。
ルート `AGENTS.md` は Codex の既定読み込み上限に収めるため、必須事項だけを保持する。
詳細確認が必要な場合は、この文書を参照する。

## 本リポジトリ固有ルール

### 適用範囲

- このファイルの指示は、より深い階層に別の `AGENTS.md` がない限り、リポジトリ全体に適用する。
- 初期状態で深い階層の `AGENTS.md` がない場合は、このファイルを唯一の作業規範として扱う。
- 今後、特定ディレクトリに専用ルールを追加する場合は、このファイルと矛盾しないようにする。

### リポジトリ概要

- 本リポジトリは、画像生成向けプロンプト設計を支援する PySide6 製デスクトップアプリ `MJ Prompt Studio` を開発する。
- アプリの目的は、ユーザーの曖昧な日本語入力、語彙不足、画像生成パラメータ知識の不足を、LLM 支援で補い、構造化された高品質プロンプトへ変換することである。
- アプリは画像生成サービス本体を自動操作しない。プロンプト作成、検証、コピー支援、参照素材管理、生成結果の手動取り込み、レビュー支援に限定する。
- 特定の Midjourney モデルバージョン専用アプリとして作らない。UI、メニュー、タブ、設定、エラー、エクスポート文書などのユーザー可視領域に、Midjourney の特定バージョン番号を表示してはならない。
- 内部実装では、Ruleset / Capability Profile によってサービス仕様差分を吸収する。内部 ID やテスト fixture にバージョン相当の識別子が必要な場合も、ユーザーへ直接露出させない。
- OpenAI Responses API を用いた LLM 支援を中核機能とする。API 使用料の節約より、品質、補助の細かさ、機能完成度を優先する。

### 想定技術スタック

- 主言語は Python とする。
- GUI は PySide6 を用いる。
- LLM 連携は公式 OpenAI Python SDK を用い、Responses API を中心に設計する。
- LLM 出力の構造化には Pydantic または同等の schema 定義を使う。
- 永続化はローカル SQLite とファイルベースの asset store を基本とする。
- API キー保存には OS の資格情報ストア、環境変数、または明示的な設定ストアを用いる。平文ファイル保存を既定にしない。
- テストは pytest を基本とし、GUI 境界は可能な範囲で pytest-qt 等を使う。
- lint / format / typecheck / test / build の入口は `Makefile` または `scripts/` に集約する。
- 実際の依存管理ツール、Python バージョン、パッケージ構成が既にリポジトリに存在する場合は、既存方針を優先し、この節を必要に応じて更新する。

### 推奨ディレクトリ構成

- `src/`: アプリ本体。
- `src/mj_prompt_studio/ui/`: PySide6 の Widget、Window、ViewModel、Action、スタイル定義。
- `src/mj_prompt_studio/application/`: ユースケース、Application Service、コマンド、DTO。
- `src/mj_prompt_studio/domain/`: PromptDocument、PromptBlock、Parameter、Ruleset、Validation、ResultReview などのドメインモデル。
- `src/mj_prompt_studio/infra/`: SQLite、ファイル保存、OpenAI client adapter、keyring、settings、logging。
- `src/mj_prompt_studio/llm/`: LLM Orchestrator、Agent、schema、prompt template、tool adapter。
- `src/mj_prompt_studio/resources/`: UI resource、theme、default ruleset、template。
- `tests/`: unit / integration / gui / contract test。
- `docs/`: 設計、画面仕様、LLM Agent 仕様、運用手順。
- `plans/`: 長大タスクの計画ファイル。
- `scripts/`: セットアップ、検証、ビルド、ローカル起動の共通入口。
- 初期リポジトリの構成が異なる場合は、まず現状を読み取り、最小限の移行計画を立ててから整理する。

### UI 表記ルール

- アプリ名はユーザー向けには `MJ Prompt Studio` を基本とする。
- UI 上に、サービス名と特定バージョン番号を組み合わせたラベルや、バージョン番号だけを強調するラベルを表示しない。
- `Alpha`、`Current Model`、`Latest Version` のようなサービス状態を誤認させる UI 表記も避ける。
- ユーザー向けの設定名は `Ruleset`、`Capability Profile`、`Prompt Compatibility`、`Generation Service Profile` など、バージョン非依存の表現にする。
- 内部 ruleset の詳細を見せる必要がある場合も、表示名は `Generic image prompt profile`、`Strict compatibility profile` などにし、内部 ID は詳細表示やログに限定する。
- エクスポートされる Markdown、チェックリスト、制作ログにも、特定の Midjourney バージョン番号を出さない。
- UI 文言追加時は、文字列リソースまたは翻訳ファイルに対して、Midjourney バージョン番号混入を検出するテストを追加または更新する。

### 画像生成サービス連携の境界

- アプリは Midjourney Web、Discord、ブラウザ、Cookie、Token、非公式 API を自動操作しない。
- 生成サービスへの投入は、ユーザーによる手動コピー、手動貼り付け、手動アップロードを前提にする。
- `Open service` 系の操作を実装する場合は、既定ブラウザで公式ページを開く程度に留め、ログイン状態、セッション、DOM、自動投稿へ触れない。
- 参照画像、生成結果画像、制作ログはユーザーが明示的にローカルへ取り込む。
- 生成結果のレビューは、ユーザーが取り込んだ画像と保存済みプロンプト情報を対象に行う。

### LLM 機能設計ルール

- LLM はアプリの中核機能として積極的に使う。語彙補助、意図分解、プロンプト生成、Prompt Doctor、Parameter Advisor、Reference Analysis、Result Review、Matrix Planning に組み込む。
- API 使用料の節約を理由に補助機能を削らない。ただし、無限ループ、重複リクエスト、意図しない大量送信は防ぐ。
- LLM Agent は Application Service から呼び出し、UI Widget から直接呼ばない。
- LLM の出力は原則 schema 化し、自由文だけに依存する実装を避ける。
- LLM に既存データの上書きを直接許可しない。変更は `Patch`、`Suggestion`、`Review` として返し、Application Service が検証して適用する。
- ユーザーの操作なしに破壊的変更を適用しない。
- 外部 API 失敗時は、UI に分かる形で再試行、失敗理由、オフライン時の制限を表示する。
- テストでは OpenAI API をモックし、CI や通常テストで実 API を叩かない。
- LLM prompt template、schema、agent policy を変更した場合は、関連する contract test と docs を更新する。

### LLM Agent の標準構成

- `IntentIntakeAgent`: 日本語の雑な制作意図を構造化 brief に変換する。
- `VocabularyAgent`: 曖昧語、短い日本語、感覚語を画像生成向け専門語彙へ展開する。
- `PromptCompilerAgent`: PromptDocument から最終プロンプト候補を生成する。
- `PromptDoctorAgent`: 意味衝突、弱い語彙、構成不足、非互換表現を検出し修正案を出す。
- `ParameterAdvisorAgent`: ユーザー目的から parameter profile を提案する。
- `ReferenceAnalyzerAgent`: 参照画像を解析し、Image Prompt / Style Reference / Moodboard 的な用途を判定する。
- `MatrixPlannerAgent`: 実験目的からパラメータ・語彙・参照の比較計画を作る。
- `ResultReviewAgent`: 手動取り込み画像と元プロンプトを比較し、次の修正案を出す。
- `FinalAuditorAgent`: コピー前やエクスポート前に、完成度、矛盾、リスク、UI 表記ルール違反を確認する。
- Agent を追加する場合は、責務、入力 schema、出力 schema、失敗時挙動、ログ方針、テストをセットで追加する。

### Ruleset / Capability Profile 設計

- 画像生成サービス仕様は、コードに直書きせず、Ruleset または Capability Profile として定義する。
- Ruleset は、対応パラメータ、非対応パラメータ、値域、組み合わせ制約、UI 表示可否、export 可否を持つ。
- UI は ruleset の内部名をそのまま表示しない。
- バージョン固有の知識を持つ必要がある場合は、内部データとして扱い、ユーザー可視文言では汎用的に説明する。
- Capability の追加・変更では、domain test、compiler test、validator test、UI 表示テストを更新する。
- 非対応機能は UI から隠すか、汎用的な説明で disabled にする。特定バージョン名を理由文に出さない。

### Prompt Composer 設計

- Composer は、`AI Brief`、`Prompt Blocks`、`Live Preview`、`Compiled Prompt`、`AI Suggestions`、`Prompt Doctor`、`Parameter Advisor` を中心に構成する。
- Prompt Blocks は少なくとも、Intent、Subject、Action / State、Environment、Composition、Camera / Lens、Lighting、Material / Texture、Color Palette、Style、Text in Image、Positive Constraints、Notes を扱う。
- Negative Prompt 欄を主要 UI として置かない。非対応 ruleset でも成立するよう、肯定形の `Positive Constraints` を基本にする。
- ユーザーが雑な入力をした場合も、AI が不足要素を補い、候補として提示する。
- AI が生成した候補は、採用前にユーザーが差分を確認できるようにする。
- Compiled Prompt は決定論的 validator を通過したものだけをコピー可能な最終候補として扱う。

### Reference Library 設計

- Reference Library は、画像、URL、スタイルコード、Moodboard 相当の識別子、ユーザー語彙、メモ、タグを管理する。
- 参照画像の解析は LLM vision 入力で行い、色、構図、照明、質感、用途判定、推奨語彙を抽出する。
- 画像そのもの、サムネイル、解析 JSON、ユーザー評価を分離して保存する。
- 参照素材の削除は破壊的操作として扱い、確認または Undo を用意する。
- 参照素材はローカル資産として扱い、明示的なユーザー操作なしに外部送信しない。ただし LLM 解析を実行する場合は、送信対象を UI で明示する。

### Result Review 設計

- 生成結果画像はユーザーの手動ドラッグ＆ドロップまたはファイル選択で取り込む。
- Result Review は、画像、元プロンプト、parameters snapshot、参照素材、ユーザー評価、AI review を紐付ける。
- AI review は、prompt adherence、composition、style match、material quality、text accuracy、commercial usability などの観点を schema 化して保存する。
- A/B 比較、失敗原因分析、次プロンプト候補生成を提供する。
- 画像レビュー結果は主観的評価を含むため、ユーザー評価と AI 評価を別 field として保存する。

### Matrix Lab 設計

- Matrix Lab は、ユーザーの目的から LLM が実験計画を作り、決定論的 generator が variant を展開する構成にする。
- 1 つの実験では、固定条件、可変軸、variant 数、評価観点を明示する。
- variant の組み合わせ爆発を防ぐため、上限、警告、分割提案を実装する。
- Matrix のコピー、CSV / Markdown export、結果取り込み、比較レビューまでを同一ワークフローとして扱う。
- 実験計画は再現できるよう保存し、後から同じ条件で再生成できるようにする。

### ストレージ設計

- PromptDocument、Reference、Run、ResultImage、AIReview、UserVocabProfile、Ruleset、Job は永続化対象とする。
- ローカル DB と asset store の整合性を保つ。DB だけ、画像だけが残る状態を避ける。
- 破損や欠損が見つかった場合は、復旧可能な範囲を UI へ示し、黙って無視しない。
- DB migration が必要な変更では、migration test と rollback 方針を用意する。
- ユーザー資産の保存場所は設定可能にするが、初期値は OS 標準のアプリデータ領域にする。

### セキュリティとプライバシー

- OpenAI API キーをリポジトリ、ログ、スクリーンショット、エクスポートへ含めない。
- ユーザーの制作プロンプト、参照画像、生成画像は機微情報になり得るため、ログには要約または ID のみを残す。
- LLM へ送信する情報は、ユーザー操作または機能実行に必要な最小単位へ絞る。
- Privacy mode を設ける場合は、API response storage、履歴送信、画像送信、ログ粒度を明確に切り替える。
- `.env`、ローカル DB、cache、export、asset、log、screenshots、API response dump は `.gitignore` に含める。
- テスト fixture に実ユーザーの画像、実 API response、実プロンプト履歴を使わない。

### 非同期処理と Job Queue

- LLM 呼び出し、画像解析、プロジェクト全体監査、Matrix 大量生成などは UI スレッドをブロックしない。
- UI から長時間処理を起動する場合は、Job として状態管理する。
- Job は `queued`、`running`、`succeeded`、`failed`、`cancelled` のような明確な状態を持つ。
- 失敗した Job は再試行可能にし、入力 snapshot、失敗理由、再試行回数を保存する。
- UI は Job の進行、完了、失敗、キャンセルを表示する。

### UI 実装ルール

- PySide6 の MainWindow は、メインワークスペース、左ナビゲーション、右 Inspector、下部 Console / Suggestions の構成を基本にする。
- 画面は `Composer`、`Free Editor`、`Matrix Lab`、`Reference Library`、`Result Review` を主要タブとして扱う。
- Widget は見た目の責務に寄せ、業務判断は Presenter / ViewModel / Application Service へ逃がす。
- Signal / Slot の接続が複雑化したら、Action 層または Controller 層を作る。
- UI 文言はハードコードせず、可能な範囲で文字列リソースへ集約する。
- 空状態、読み込み中、LLM 処理中、エラー、API 未設定、オフライン、DB 破損、初回起動の UI を用意する。
- 視認性、キーボード操作、ラベル、ツールチップ、長文表示、ウィンドウリサイズ時の崩れを確認する。

### API / LLM 設定

- 実APIの全Responses API呼び出しは、設定モジュールの固定実行ポリシーを唯一の正本として `gpt-5.6-luna`、reasoning effort `high`、text verbosity `low` を使う。
- モデルと推論強度をAgent、機能別保存設定、環境変数、UI、API requestから上書きできる構造を追加しない。
- timeout、retry、response storage mode、語彙量などモデル非依存の設定だけを変更可能にする。
- 実 API 呼び出しを必要とする手動検証は、通常テストとは分離し、明示的な環境変数やフラグがある場合のみ実行する。
- API エラー、rate limit、schema mismatch、network timeout、cancelled job、invalid API key を区別して扱う。
- Structured Outputs の schema 変更では、後方互換性と migration を確認する。

### 検証コマンド方針

- 既存の `Makefile` または `scripts/` に入口がある場合は、それを優先する。
- 入口がない場合は、早い段階で以下のような標準コマンドを整備する。
  - `make format`
  - `make lint`
  - `make typecheck`
  - `make test`
  - `make build`
  - `make run`
- GUI 起動確認が自動化できない場合も、最小限の import test、window construction test、service test を用意する。
- CI がない初期状態でも、ローカルで再現可能な検証コマンドを README に記載する。
- `/goal` タスクの完了前には、少なくとも lint、typecheck、test、該当する build / packaging 確認を実行する。

### ドキュメント構成

- `README.md` には、概要、セットアップ、起動、検証、設定、API キー、開発コマンド、禁止事項を簡潔に記載する。
- `docs/architecture.md` には、UI / Application / Domain / Infra / LLM の責務と依存関係を書く。
- `docs/ui-spec.md` には、主要画面、タブ、パネル、ユーザー操作、エラー状態を書く。
- `docs/llm-agents.md` には、Agent ごとの責務、入力、出力、schema、失敗時挙動を書く。
- `docs/rulesets.md` には、Ruleset / Capability Profile の構造、追加方法、UI 表示ルールを書く。
- `docs/security.md` には、API キー、ログ、ローカル資産、外部送信、Privacy mode の方針を書く。
- `docs/process/task-execution.md` には、長大タスクの実行手順、検証、計画ファイル更新方法を書く。
- ドキュメントは実装と同じ変更内で更新する。

### 大規模タスク分割方針

- 本リポジトリのタスクは、細かい実装ステップではなく、ユーザー価値のある大きな縦切りで分ける。
- 例として、次のような単位を 1 タスクコミットの目安にする。
  - アプリ基盤、設定、標準検証、最小 UI shell、README をまとめて実装する。
  - PromptDocument domain、Ruleset、Compiler、Validator、Composer UI、保存、テストをまとめて実装する。
  - LLM Orchestrator、主要 Agent、schema、mock client、AI Brief、Prompt Doctor の UI 統合をまとめて実装する。
  - Reference Library、画像取り込み、vision 解析、保存、UI、テストをまとめて実装する。
  - Matrix Lab、実験計画、variant 生成、export、Result Review 連携をまとめて実装する。
  - Result Review、画像評価、A/B 比較、次プロンプト生成、レビュー保存をまとめて実装する。
- ただし、1 タスク内のマイルストーンは検証可能な小単位に分け、計画ファイルで進捗管理する。
- タスクが大きいことを理由にテストやドキュメントを後回しにしない。

### 品質ゲート

- UI に Midjourney の特定バージョン番号が表示されないこと。
- 画像生成サービスの自動操作、Cookie / Token 抽出、非公式 API 呼び出しが存在しないこと。
- LLM 出力が schema 検証を通り、失敗時に UI が破綻しないこと。
- OpenAI API キーやユーザー資産が git 追跡対象にならないこと。
- 主要ユースケースに Unit Test または Integration Test が存在すること。
- Prompt Compiler、Validator、Ruleset、LLM schema、Storage、Job Queue は単体テストで保護すること。
- 新規 UI には空状態、失敗状態、長文入力、保存復元のテストまたは手動検証記録を用意すること。
- README と関連 docs が実装に追従していること。

### リポジトリ運用

- 依存追加は目的を明確にし、同じ変更で設定、lockfile、README、テストを更新する。
- 環境変数名と既定値の正本は実装コードと `env.example` に置き、追加や変更時は `README.md` と関連文書も同期する。
- 起動、テスト、ビルドは ad hoc なワンライナーより `scripts/` と `Makefile` の既存入口を優先する。
- ルールや作業指針に明らかな不備、重複、陳腐化、スコープ漏れ、運用上の摩擦が見つかった場合は、その知見を対応する `AGENTS.md` へ反映して自己改善する。
- 自己改善を行う際は、抽象論を増やすのではなく、今回の不備を今後どう防ぐかが伝わる具体的なルールへ書き換える。
- repo 全体に効く改善はルートの `AGENTS.md` に、特定技術や特定ディレクトリだけに効く改善は最も近い階層の `AGENTS.md` に記載する。
- 既存ルールと矛盾する場合は放置せず、重複排除、統合、優先順位の明確化まで同じ変更で行う。

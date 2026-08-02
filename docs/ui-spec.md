# UI Spec

## 全体構成

- Header / Toolbar: 新規プロジェクト、Undo/Redo、Export、保存状態。
- Left Panel: Project Explorer、制作の流れ。制作の流れは「プロンプトを作る」から「生成結果を見直す」までを目的名で並べ、必要な画面だけを選べるようにする。
- Main Tabs: プロンプトを作る（Composer）、Prompt Workshop、参考画像を使う（Reference Library）、複数案を比較する（Matrix Lab）、生成結果を見直す（Result Review）、設定（Settings）。
- Right Panel: AI Inspector、Parameter Advisor、Prompt Doctor。
- Bottom Panel: Status、Jobs。
- Right-bottom Help: 常設の「使い方」buttonから開く、modalではない折りたたみpanel。Quick Startとユーザーマニュアルを安全なMarkdown previewとして表示し、文書の目次、節ジャンプ、現在の画面に対応する節へのクイックジャンプを提供する。

Dock実装ではなくReact layoutで構成する。情報配置は旧クライアントの作業順序を維持する。

## ビジュアルデザイン

- 全体は深いネイビー系のダークUIとし、制作ツールとして長時間見ても眩しくない低彩度の背景を使う。
- 操作対象のパネル、カード、テーブル、フォームは細い境界線と8px以下の角丸で区切り、浮遊カードを過剰に重ねない。
- 主要操作と選択状態は青紫、保存済みや成功状態は緑、警告は黄、危険操作は赤で統一する。
- Header、Left Panel、Main Tabs、Right Panel、Bottom Panel は常時識別できる密度にし、テキストやボタンが小さい画面で重ならないようにする。
- ユーザー向け文言ではRulesetの内部IDと特定のMidjourneyモデルバージョン番号を表示しない。

## Composer

初見導線:

- 画面の先頭で「プロンプトを作る」目的、使う場面、作成 → 外部サービスへ手動貼り付け・生成 → 生成結果を見直す流れを示す。
- 最初の有意味な操作はAI Briefへの制作意図入力であり、入力欄へfocusする明示buttonを表示する。

主要操作:

- 日本語のAI Brief入力。
- `AI Brief から構造化` でIntent Intake AgentをJob Queue経由で実行。
- Prompt Blocks全項目を手動編集する。
- 各Blockに `AI補完`、`候補`、`専門語化`、`短縮`、`説明` を表示する。
- 1000ms debounceで自動提案をJob Queueへ流し、古い入力に対する完了結果は破棄する。
- `Compile` で決定論的Prompt CompilerとValidatorを実行し、Prompt Compiler Agentのレビューを非同期表示する。
- `Compiled Prompt` はClipboard APIでコピーし、失敗時は手動コピー用textareaを出す。
- Undo/Redoで保存済みPromptDocument状態を戻す。
- AI Patchは候補として表示し、適用前にreason、field_path、old_value、new_value、confidenceを確認する。

空状態:

- 初回起動時はサンプルプロジェクトとPromptDocumentを作る。

エラー状態:

- LLM Job失敗時は下部Jobsとstatusに安全なエラーを表示する。

## Prompt Workshop

初見導線:

- 材料なしの複数案生成と、既存文章の変換・改善を同じ画面で混同せず、別sectionとして示す。

主要操作:

- ゼロ入力のPrompt生成は件数1〜30（初期値10）、カオス度1〜10、英語/日本語、任意ガイダンス、重複除外を扱う。
- 既存Promptは世界観整形、カオスミックス、文字数のみ調整、LLMアレンジを分けて実行する。後者はプリセットと強度0〜3を扱う。
- 結果はコピー、入力欄への反映、確認付きComposer取り込みを提供する。
- Job作成中は同じ創作系操作を重複実行せず、部分成功・失敗はJobsとstatusで回復方法を示す。
- 従来の6種Vocabulary変換は互換導線として残す。

## Reference Library

初見導線:

- 「参考画像からヒントを得る」目的と、表現の方向性に迷うときに使う補助画面であることを示す。

主要操作:

- 画像ファイルをfile pickerまたはdrag & dropでAPI upload endpointへ送る。
- 取り込み時にAssetStoreへ保存し、画像サイズ、形式、ファイルサイズ、簡易カラーパレットをローカル抽出する。
- safe asset URLでpreviewを表示し、OS local pathはDOMへ出さない。
- AI分析で照明、色、構図、質感、推奨モード、語彙を保存する。
- タイトル、タグ、抽出語彙で検索する。
- タグを保存し、削除時は確認ダイアログを表示する。
- 抽出語彙をComposerへPatchとして戻す。

## Matrix Lab

初見導線:

- 「複数案を比較する」目的と、構図・スタイルなどの条件を比較したいときに使うことを示す。

主要操作:

- 実験目的からAIが軸と固定条件を提案する。
- 決定論的Generatorがvariantを展開しRepositoryへ保存する。
- 選択Variantコピー、一括コピー、CSV/Markdown download/copyができる。

## Result Review

初見導線:

- 「生成結果を見直す」目的と、外部サービスで画像を手動生成した後に戻る画面であることを示す。

主要操作:

- 生成結果画像をfile pickerでAPI upload endpointへ送る。
- Source Prompt、parameters snapshot、previewへ紐付ける。
- AI Review、複数画像比較、Next Prompt Candidate、Final Auditを表示する。
- Next Prompt CandidateはComposerへPatchとして戻し、適用前に確認する。

## Settings

初見導線:

- 「AI支援の設定を確認する」目的と、API keyがなくてもMock LLMで画面の流れを試せることを示す。プロンプト作成の必須前提には見せない。

表示:

- セッション内API key適用。
- OS資格情報ストアへのAPI key保存。保存不可環境ではセッション内適用に留める。
- 保存済みOS資格情報ストアからAPI keyを読み込み、値を表示せずセッションへ適用する。未発見・利用不可・失敗時は設定を変更せず、次の行動を示す。
- Privacy mode / normal response storage。
- Text output policy: 構造化オプションを全テキストPrompt出力へ付与するかを切り替える。OFFでもParameterとJSON snapshotは保持する。
- Prompt除外語句: 追加、1行ずつの一括編集、個別削除、確認付き全消去。創作系操作だけへ適用範囲を明示する。
- AI execution profile: `GPT-5.6 Luna`、`High`、`Low` を読み取り専用表示。
- Feature vocabulary preferences: Agentごとの語彙量だけを編集・保存。
- Ruleset display_name。
- connection test。

モデルと推論強度のselectは表示しない。下部Jobsには新規Jobのモデル、推論強度、応答詳細を表示する。

UIではRulesetの内部IDと特定のMidjourneyモデルバージョン番号を表示しない。

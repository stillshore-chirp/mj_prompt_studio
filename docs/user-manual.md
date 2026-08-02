# MJ Prompt Studio ユーザーマニュアル

MJ Prompt Studioは、画像生成に使うプロンプトを考え、整え、比較し、結果を見直すための制作支援アプリです。画像生成サービスを自動操作するアプリではありません。最終プロンプトは自分でコピーし、生成結果の画像も自分で取り込みます。

## 最初に理解する制作の流れ

1. `プロンプトを作る`で、作りたい画像を日本語で書き、コピーできるPromptへ整える。
2. コピーしたPromptを画像生成サービスへ自分で貼り付け、画像を生成してローカルへ保存する。
3. `生成結果を見直す`で画像を取り込み、次のPrompt候補を確認して改善を続ける。

`Prompt Workshop`、`参考画像を使う`、`複数案を比較する`は、必要なときだけ制作を補助する画面です。

## アプリ内ヘルプ

右下の「使い方」を押すと、作業を閉じずにQuick Startとこのマニュアルを読めます。panel内の目次で節を選ぶか、「この画面の使い方へ」で表示中の画面に対応する節へ移動してください。ヘルプはアプリに同梱された文書だけを表示し、任意のローカルファイルは読み込みません。

## 起動と画面構成

`make run` でlocalhost APIとReact clientを起動し、ブラウザで `http://127.0.0.1:5173` を開きます。

画面は次の領域に分かれています。

- Header: 新規プロジェクト、Undo/Redo、Export。
- Left Panel: プロジェクト一覧、制作の流れ。必要な画面だけを順に選べます。
- Main Tabs: `プロンプトを作る`、`Prompt Workshop`、`参考画像を使う`、`複数案を比較する`、`生成結果を見直す`、`設定`。各画面の先頭に目的と使う場面を表示します。
- Right Panel: AI Inspector、Parameter Advisor、Prompt Doctor。
- Bottom Panel: 保存状態とJobs。

## AI接続

AI支援を使う場合は、起動前に環境変数 `OPENAI_API_KEY` にAPIキーを入れておくと自動で読み取ります。互換名の `OPENAI_KEY` と `MJPS_OPENAI_API_KEY`、保存済みのOS資格情報ストアも起動時に順に確認します。

```bash
export OPENAI_API_KEY="..."
```

起動後に設定する場合は `Settings` を開き、`API Key` に入力して `このセッションだけで使用` を押します。OS資格情報ストアへ保存する場合は `OS資格情報ストアへ保存` を押します。保存済みのキーを使う場合は `OS資格情報ストアから読み込んで使用` を押すと、キーの値を表示せず現在のセッションへ適用します。保存・読み込みができない環境では、その起動中だけ有効になります。

APIキーがない場合、通常起動ではAI実行を開始せず、画面下部とSettingsに安全な理由と設定導線を表示します。MockLLMでの開発用確認は `MJPS_LLM_MODE=mock` を明示した場合だけです。実APIの接続確認は `Test` で実行し、明示的Mockでは接続成功として扱いません。

## AI実行構成

実APIの全Agent、画像解析、再試行、接続テストは `GPT-5.6 Luna`、推論強度 `High`、応答詳細 `Low` の固定構成を使います。`Settings`の`AI execution profile`で実効値を確認できますが、モデルと推論強度は変更できません。機能別に変更できるのは、モデル非依存の語彙量だけです。

以前の機能別モデル設定は起動時に移行され、語彙量だけが保持されます。旧モデル由来の会話継続IDはLunaの最初の呼び出しへ渡されません。

## Privacy Mode

`Settings` の `Privacy mode` を有効にすると、Responses APIの保存を無効化し、会話ID継続を使いません。画像解析や結果レビューを実行する場合、対象画像と必要なメタデータはAIへ送られます。

## プロジェクト

- `New`: 新しいプロジェクトとPromptDocumentを作る。
- Project Explorer: 既存プロジェクトを開く。
- `Undo` / `Redo`: 保存済みPromptDocument状態を戻す。
- `Export`: Markdown recordなどを出力する。

保存と読み込みの正本はSQLiteです。React stateは表示中状態に限定されます。

## Composer

1. `AI Brief`に日本語で制作意図を書く。
2. `AI Brief から構造化`を押す。
3. Prompt Blocksを確認し、必要な欄を直す。
4. 各Blockの `AI補完`、`候補`、`専門語化`、`短縮`、`説明` で語彙補助を使う。
5. `Compile`を押す。
6. `Compiled Prompt`を確認し、コピーアイコンでコピーする。

AIが返すPatchは、reason、field_path、old_value、new_value、confidenceを確認してから適用します。

## Parameter Advisor

右側のParameter AdvisorはRulesetで表示可能なパラメータからフォームを生成します。手動変更した値は次のCompileに使われます。AI提案を使う場合はAI adviceボタンを押し、提案内容と理由を確認してから適用します。

## Prompt Doctor

右側のPrompt DoctorはValidatorのissueとAI修正候補を表示します。Run Prompt Doctorを押すとJobが作成され、完了後にPatch候補が表示されます。Patchは確認ダイアログを通して適用します。

## Prompt Workshop

`Prompt Workshop`は、材料がないときの複数案生成と、既存Promptの整形を分けて扱います。すべてのAI操作はJobとして実行され、実行中・完了・失敗は下部のJobsで確認できます。

- `ゼロからPromptを生成`: 件数（1〜30、初期値10）、カオス度、英語/日本語、任意ガイダンスで案を生成します。案ごとにコピーまたは作業中のPromptへ反映できます。
- `世界観整形` / `カオスミックス`: 作業中のPromptの主題・主要語句を保ちながら、一枚の画像として読みやすく整えます。出力言語、上限、任意ガイダンスを指定できます。
- `文字数のみ調整`: 意味・主題・画風を優先して保持する専用操作です。0.5 / 0.8 / 1 / 1.2 / 2倍と上限を選べ、除外語句は適用しません。
- `LLMアレンジ`: `自動`またはカテゴリ付きプリセット、強度0〜3を選んで視覚表現を整えます。プリセットの指示本文は画面・Job履歴へ表示しません。
- 結果はコピー、作業中のPromptへの反映、確認付きのComposer取り込みを使えます。従来の6種変換も下部に残しています。

## テキストPrompt出力と除外語句

`Settings` の `テキストPrompt出力` では、構造化されたオプションをテキストPromptへ付けるかを切り替えます。設定をOFFにしても、PromptParametersとJSON snapshotは保持されます。Composer、export、Matrix、Result Reviewの新しい候補、Prompt Workshopのテキスト結果に同じ設定が適用されます。

`Prompt除外語句` は1行1件で追加・編集・削除できます。空白・大文字小文字・Unicode正規化の差分は重複としてまとめられ、最大200件、各100文字です。新規生成、世界観整形、カオスミックス、LLMアレンジにだけ適用し、文字数のみ調整や既存Promptの保存には適用しません。除外語句はJob入力snapshotや公開用の証跡へ文字列として残しません。

## Reference Library

1. `Add` またはdrag and dropで画像を取り込む。
2. プレビュー、画像サイズ、形式、カラーパレットを確認する。
3. 分析アイコンでReferenceAnalyzerAgentを実行する。
4. 抽出語彙を選び、ComposerへのPatchとして戻す。
5. タグを編集して保存する。
6. 不要な素材は削除アイコンから確認後に削除する。

React UIにはOS local pathを表示しません。previewはsafe asset endpointから返されます。

## Matrix Lab

1. Objectiveに比較したい目的を書く。
2. `AI Plan`で実験計画を作る。
3. `Generate`でvariantを展開する。
4. selected/all copy、CSV、Markdownを使って生成サービスへ手動投入する。

variant生成は決定論的Generatorで行われ、Repositoryへ保存されます。

## Result Review

1. 生成サービス側で作った画像をローカルに保存する。
2. `Result Review`の`Import`で画像を取り込む。
3. Source Promptとparameters snapshotを確認する。
4. `AI Review`でスコア、良い点、課題、Next Prompt Candidateを保存する。
5. `Next Prompt`を使う場合は確認ダイアログで差分を確認して適用する。
6. `Compare`で複数レビューを比較する。
7. `Final Audit`でコピー前の最終確認を行う。

## Jobs

AI処理はJob Queueで実行され、下部に状態が表示されます。

- `queued`: 順番待ち。
- `running`: 処理中。
- `succeeded`: 完了。
- `failed`: 失敗。
- `cancelled`: キャンセル済み。

実行中Jobはキャンセルできます。失敗したJobは再実行できます。
各Jobには実行時のモデル、推論強度、応答詳細が表示されます。新規Jobと再実行は常に同じ固定構成です。

## エクスポート

利用できる主な形式:

- Prompt only
- Markdown record
- JSON snapshot
- Matrix CSV
- Matrix Markdown

ブラウザのClipboard APIが使えない場合は、手動コピー用のtextareaが表示されます。

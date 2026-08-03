# Issue #70 mock→real会話継続境界 UI/UX・完了ゲート報告

## 概要

- 対象Issue / PR / 作業: Issue #70 / mock由来の会話継続IDをreal APIへ送らない
- 画面・component・状態: ComposerのAI Brief構造化を含むPromptDocument継続Agent、mock / real切替、queued / running / succeeded / failed
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象、文脈、目的、支援task: mock modeで試したPromptDocumentをreal modeでも使う制作者が、入力やDocumentを作り直さずAI処理を実行できるようにする。
- 助ける理解・判断・行動・回復: 内部backend切替をユーザーに判断させず、継続不能なIDだけを捨てて新規応答として回復する。
- UIがなければ困る点 / 削る候補: 既存Jobs表示と安全診断は維持する。今回の正常回復に新しい説明、確認、再入力は不要。
- 検証仮説: mock→realでrequest段階の`invalid_value`を回避できる。provider応答原文を保持していないため、実API smokeまでは直接原因の最終確定ではない。

## 初見・state matrix

- 画面目的、現在地、最初の行動、結果予測、回復: Composerの既存表示・AI Brief入力・構造化button・Jobs状態・失敗回復を変更しない。利用者は従来どおり構造化を実行し、backend切替の内部事情を意識しない。

| 状態 | 内部判断 | ユーザーが見る結果 | 次行動・回復 | 証跡 | 判定 |
|---|---|---|---|---|---|
| mock→mock / 同一モデル | mock IDを保持 | 既存mock Job状態 | 従来どおり継続 | unit test | Pass |
| OpenAI→OpenAI / 同一モデル | OpenAI IDを保持 | 既存real Job状態 | 従来どおり継続 | unit test | Pass |
| mock→OpenAI / 同一モデル | IDを送らない | 新規real Jobとして待機・成功または既存分類の失敗 | 入力保持。失敗時は既存Jobs回復導線 | unit test | Pass |
| backend由来不明→OpenAI | IDを送らない | 新規real Jobとして処理 | 入力保持 | unit test | Pass |
| 旧モデル→現行model | IDを送らない | 新規応答として処理 | 入力保持 | 既存unit test | Pass |
| Privacy mode | orchestratorがIDを除去し`store=false` | 既存Privacy mode契約 | 従来どおり実行 | 既存unit test | Pass |
| API key未設定・network・provider error | 今回の境界外 | 既存の原因別安全診断 | 既存Settings・待機・詳細確認 | 既存回帰test | Pass |

## 品質確認

- accessibility: DOM、keyboard、focus、accessible name、status通知に変更なし。既存Jobs status契約を保持する。
- 視覚階層: 画面描画、主操作、grouping、密度、狭幅表示に変更なし。
- copy: ユーザー可視文言と禁止表記に変更なし。
- 熟練者効率: backend切替後の不要な再入力、Document再作成、原因不明の反復実行を減らす。追加確認は設けない。
- 満足感・信頼感: mock IDを外部へ送らず、入力を保持したまま新規real応答へ回復する。API key、prompt、response ID、provider応答原文を新たに表示・log保存しない。
- 反証レビュー: モデル一致だけではbackend境界を保護できないため不十分。ID prefix判定はprovider形式への依存と由来偽装を招くため採用せず、保存済み`execution_backend`と実行先backendの一致を正本にした。由来不明の旧データを継続させない安全側判断を確認した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P1 | 会話継続境界 | 同一モデルのmock IDをreal APIへ渡せる | request段階でAI処理が失敗する | 保存元と実行先backendの一致を必須化 | 修正済み |

## 証跡・検証

- 変更前/変更後screenshot: N/A — UI描画、文言、DOM、accessibility構造を変更していない。状態遷移のbackend契約だけを修正した。
- test / trace / 手動確認: 修正前は追加回帰test 4件が失敗。修正後はPython test 97件、client test 62件、lint、typecheck、Python/client build、governance検証が成功。詳細はplanとPRへ記録する。
- 取得できなかった証跡と理由: 実API smokeは課金・実provider境界のため通常CIでは実行しない。provider応答原文と識別子は安全方針により公開しない。

## 完了ゲート

- [x] ユーザー価値、初見理解、state matrixを確認した。
- [x] accessibility、視覚階層、copyを確認した。
- [x] 熟練者効率、満足感・信頼感、反証レビューを確認した。
- [x] UI描画変更がないためscreenshot対象外であることを記録した。
- [x] 未実行検証と残リスクを明示した。
- [x] lint、typecheck、test、build、client検証を完了した。
- [ ] CI、Codex review、未解決review thread確認を完了する。

## 未実行・残課題

| 優先度 | 内容 | 理由・risk | 次action |
|---|---|---|---|
| residual | 修正後の実API smoke | 通常CIで実APIを呼ばない。直接原因の最終確定が残る | 明示的な実API検証手順で安全診断だけを確認する |

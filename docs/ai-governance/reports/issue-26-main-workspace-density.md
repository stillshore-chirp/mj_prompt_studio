# Issue #26 主作業を優先する文字サイズ・pane密度

## 概要

- 対象Issue / 作業: #26 / Composer、非Composer画面、共通layout
- 判定: Pass（実ユーザー評価を除く）
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象・文脈・目的: 長時間のPrompt編集で、入力欄・見出し・補助文を無理なく読み、主作業を中断せずに進める。
- 改善: 基準文字を16px・行間1.55へ上げ、主見出し・field label・補助文・AI処理履歴の表示を拡大した。desktopは左右paneを270px / 300pxへ整理し、非Composer画面ではInspectorを既定で隠してmain workspaceを広げる。
- 検証仮説: 常時不要な補助情報を明示操作へ退避し、本文と操作対象を大きくすることで、初見の可読性と熟練者の編集面積を両立できる。実ユーザー評価は未実施。

## state matrix

| 状態 | 表示・操作 | a11y・reflow | 判定 |
|---|---|---|---|
| Composer / 通常幅 | Inspectorを維持し、入力・補助文を拡大 | 既存のregion/labelを維持 | Pass |
| Free Editor等 / 通常幅 | Inspectorを隠してmainを優先し、「AIの状況を表示」で再表示 | native button、`aria-pressed` | Pass |
| Inspector再表示 | 表示後に同じbuttonで隠せる | `AIの状況` regionがkeyboard操作後も到達可能 | Pass |
| 760px幅 | 一列layoutでmain、Settings、Inspector、AI処理へ到達 | 横overflowなしをE2Eで確認 | Pass |
| 125%相当文字拡大 | Subject、Settings、Inspectorへ到達 | 横overflowなしをE2Eで確認 | Pass |

## 品質確認

- 視覚階層: Composerでは支援情報を残し、それ以外では主作業を常時優先する。Inspectorの機能は削除せず、現在の表示状態が分かるbuttonから再表示できる。文字拡大でconfirmation dialogがviewportを超える場合も、dialog内scrollで操作を失わない。
- accessibility: 表示切替はnative buttonと`aria-pressed`で表し、重要領域の`aria-label`/`region`を変更していない。狭幅・拡大時にもkeyboard到達できることをE2Eで確認した。
- copy: 「AIの状況を表示」「AIの状況を隠す」で状態と結果を明確にした。特定の画像生成サービスversion表記は追加していない。
- 反証レビュー: Inspectorを単に非表示にすると支援機能が見つからなくなるため、非Composerのtab barに常設の切替buttonを置いた。760px以下では専用grid指定により、隠したInspector用の空きrowを残さない。

## 証跡・検証

- 変更前screenshot: `/private/tmp/mjps-issue-26-before.jpg`（隔離mockデータのみ）
- 変更後screenshot: `/private/tmp/mjps-issue-26-after.jpg`（隔離mockデータのみ）
- 文字拡大screenshot: `/private/tmp/mjps-issue-26-text-zoom.jpg`（隔離mockデータのみ）
- test: `make client-lint`、`make client-typecheck`、`make client-test`（34 tests）、`make client-build`、`git diff --check`、`bash scripts/verify-ai-governance.sh`。
- E2E: Inspector文脈表示、760px reflow、125%相当文字拡大を隔離Mock Playwrightで確認。全suiteの実行はPR CIでも確認する。
- 未実施: 実OpenAI API、実ユーザー評価。Mock UI・レイアウト・状態遷移のみを確認した。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実ユーザー評価 | ローカル開発タスク | 読みやすさの主観的な差は未計測 | #22の匿名・任意調査手順で評価する |

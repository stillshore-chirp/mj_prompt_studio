# Issue #64 ユーザーマニュアル再構成 UI/UXレビュー

## 概要

- 対象Issue / 作業: [#64](https://github.com/stillshore-chirp/mj_prompt_studio/issues/64) / アプリ内「使い方」に表示されるユーザーマニュアル
- 画面・component・状態: `docs/user-manual.md`、Help Widgetのユーザーマニュアルtab、Composer・Prompt Workshopからの文脈ジャンプ
- 判定: Pass
- P0 / P1 / P2件数: 0 / 0 / 1

## ユーザー価値

- 対象、文脈、目的、支援task: 画像生成の制作を始める人、または生成後に改善点を決めたい人が、現在の悩みから必要な画面を選び、次の行動を予測する。
- 助ける理解・判断・行動・回復: 各機能について、存在理由、使う・使わない判断、操作後の結果、最短手順、注意点または回復方法を同じ順で提示する。外部サービスへの手動投入、AI送信、提案の確認、削除・再試行の境界も説明する。
- UIがなければ困る点 / 削る候補: 手順だけでは機能の選択理由を推測する必要がある。Quick Startは最短手順という別の目的を持つため、詳細な判断説明を重複させず維持した。
- 検証仮説: 初見利用者は冒頭の「いまの悩みから画面を選ぶ」で入口を選び、各節で実行前に期待結果と適用範囲を確認できる。実ユーザーの理解度・完遂率は未計測。

## 初見・state matrix

- 画面目的、現在地、最初の行動、結果予測、回復: Help Widgetのタイトル、現在文書のstatus、目次、`この画面の使い方へ`が現在地を示す。改修後の先頭にはアプリの責務、外部サービスを手動で扱う理由、悩みから選ぶ画面を置いた。各機能節は操作前・操作後・使わない判断・回復を示す。

| 状態 | 見えるもの | 理解 / 次action | a11y通知・構造 | 証跡 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 通常 | 目的、選択導線、機能別見出し、箇条書き | 悩みから画面を選び、該当節の最短手順へ進む | 見出しとlist、目次button | 改修後screenshot、Help E2E | Pass |
| 初回 / 空 | 右下の`使い方`、Quick Start、ユーザーマニュアル | 最短手順か目的別説明を選ぶ | button、tablist、tabpanel | 既存Help Widget unit / E2E | Pass |
| AI未設定 / disabled | Settings節とJobs節の理由・次action | key設定、接続確認、またはAI操作を使わない判断 | Settings / Jobs節の見出し、既存status | 改修後本文、Mock表示確認 | Pass |
| running / failed / cancelled | Jobs節の状態別の意味と回復 | 待機、取り消し、入力・接続確認、再試行を選ぶ | 状態名をテキストで説明 | 改修後本文、既存Jobs UI | Pass |
| 画像分析 / 外部送信 | Reference / Result Reviewの送信範囲と手動投入の境界 | 分析・AI Reviewを実行しない選択、または差分確認後の適用 | 節見出しと箇条書き | 改修後本文 | Pass |
| 狭幅 / 長文 | Help panel内の目次とスクロール可能な本文 | 必要な節へ目次または文脈ジャンプで移動する | navigation、tabpanel、keyboard tab操作 | 標準E2Eの狭幅回帰、改修後screenshot | Pass |
| 文書切替 / Escape | tab切替、Escape後の起点へのfocus復帰 | Quick Startと詳細マニュアルを切り替え、閉じて元の作業へ戻る | tablist、tabpanel、focus復帰 | Help Widget unit / E2E | Pass |

## 品質確認

- accessibility: 既存のbutton、tablist、tabpanel、navigation、statusの構造を変えていない。新しい本文はrendererが対応する見出し・段落・ordered list・bullet listだけで構成し、未対応のMarkdown tableは使わなかった。Escape・focus復帰・文書tabのキーボード操作は既存unitとE2Eで確認した。
- 視覚階層: 先頭を「アプリの責務」→「悩みから画面を選ぶ」→「制作ループ」とし、各機能節は「この画面が解決すること」を最初に置いた。長文でも既存の目次から見出しへ移動できる。
- copy: 操作名ではなく利用者の判断と結果を主語にした。AI・画像・外部サービスの境界を保証表現にせず、実行しない選択と回復経路も記述した。特定のMidjourneyバージョン番号、API key、ユーザーprompt、画像、ローカルpath、実行IDは含めない。
- 熟練者効率: 手順だけを読みたい場合はQuick Startを維持し、経験者が長い本文を順読しなくても目次・文脈ジャンプで目的の節へ到達できる。
- 満足感・信頼感: API key、Privacy mode、画像分析、Result Review、Patch、Jobs、Exportの「なぜ」「何が送られるか」「何が適用されないか」を明記し、利用者が操作の範囲を判断できるようにした。
- 反証レビュー: 手順の直前に目的がない節、類似機能の使い分けがない節、外部サービスの自動操作を示す表現、AI送信・削除・失敗時の次action漏れ、renderer未対応Markdownを確認した。該当するP0 / P1は残っていない。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
| --- | --- | --- | --- | --- | --- |
| P2 | 実利用 | 初見利用者が実際にどの入口を選ぶかは未計測 | 実利用時の理解速度・満足度は未確定 | 実ユーザーテストまたは問い合わせ分析で入口・用語を検証する | 後続候補 |

## 証跡・検証

- 変更前screenshot: `docs/ai-governance/evidence/issue-64/before-user-manual.png`
- 変更後screenshot: `docs/ai-governance/evidence/issue-64/after-user-manual.png`
- 表示確認: 専用のMockデータ、別ポートで起動した現在の作業ツリーから、Help Widgetのユーザーマニュアルtabに改修後の冒頭、選択導線、Prompt Workshop節が表示されることを確認した。
- E2E: 最新main統合後に、専用portで標準E2E全24件を確認した。Prompt Workshopで`この画面の使い方へ`を押した後、ユーザーマニュアルに目的とMatrix Labとの使い分けが表示されることを含む。
- 公開安全性: screenshotは固定のサンプルプロジェクト・空の入力だけを含むことを目視確認した。API key、個人情報、ユーザーの画像・prompt、ローカルpath、実行IDは含まれない。

| 未実行検証 | 理由 | 残リスク | 後続 |
| --- | --- | --- | --- |
| 実ユーザーによる理解度・完遂率測定 | 実ユーザー調査は今回の文書改修の範囲外 | 初見シミュレーションだけでは実利用の迷いを完全には測れない | P2として利用状況を確認する |
| 支援技術による実機読上げ | 実行環境外 | スクリーンリーダー固有の読み上げ順は未確認 | VoiceOver / NVDAでHelp Widgetを確認する |

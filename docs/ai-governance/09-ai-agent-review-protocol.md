# AIエージェントレビュー・プロトコル

この文書は、AI agentがMJ Prompt StudioのUI/UX reviewを実行する手順です。変更差分reviewでは、03の証跡にtarget scopeとfindingの由来を追加します。

## 1. 目的

「良さそう」という印象ではなく、観察、判定、反証、証跡提出を分けて、Pass / Failを第三者が追える状態にします。

## 2. 推奨role

一つのagentが実行する場合も、次の観点を分けます。

- Scope評価者: target snapshot / ref、base / head SHA、追加・削除差分、Issue / PR / commitのintent、consumer、representative surface、coverageを確定する。
- 実装者: 要件と既存契約を満たす。自分の実装を最終承認しない。
- 価値評価者: 対象ユーザー、目的、支援するtask、意思決定への貢献を確認する。
- 初見ユーザー: 目的、現在地、最初の行動、結果予測、回復手段を確認する。
- 認知負荷監査者: 記憶要求、選択肢、内部用語、過剰説明、判断負荷を確認する。
- accessibility監査者: keyboard、focus、name、label、構造、contrast、target、状態通知を確認する。
- 視覚・状態監査者: hierarchy、主操作、密度、grouping、loading、empty、error、recoveryを確認する。
- 熟練者・trust評価者: 反復作業の手数、再入力、待機、失敗、危険操作、個人情報、送信、公開への安心感を確認する。
- 反証reviewer: 実装を落とすつもりでP0/P1、削除signal、未確認surface、evidence不足を探す。
- 検証報告者: 実行済み、未実行、残るriskを分離する。

## 3. 実行順序

レビュー経路（UI変更、フロー監査、併用）を確定し、差分があればtarget snapshot / ref、base / head、intent、追加・削除、影響surface、coverageを固定します。

その後、ユーザー価値、初見理解、state matrix、認知負荷、accessibility、視覚階層、copy、熟練者効率、trustを確認し、findingをIntroduced / Regression / Pre-existingへ分類します。最後に反証review、証跡、未実行検証、残るriskを報告します。

フロー監査を併用する場合は、Skillの重要stepと03のcurrent-run証跡を同じ報告へ接続します。差分scopeの証跡だけでflowを監査済みとせず、flow証跡だけで変更由来を断定しません。

## 4. 反証review

- diffの追加側と削除側、通常以外のstate、recovery、responsive、copy、tokenを確認する。
- shared primitive、global token、common componentの未確認consumerを探す。
- screenshotがhappy pathだけでないか、screenshotで確認できないsemantic・keyboard・時間変化を区別する。
- 自動検査で見えない使いにくさ、初心者配慮と熟練者効率の衝突、ユーザーへの不安や責任転嫁を探す。
- baseでも再現する問題をRegressionと誤分類しない。Pre-existingを今回の変更起因件数・責任へ混ぜない。
- 変更目的または安全性を阻害するP0/P1は、別Issue化してもblockingから外さない。

## 5. 出力

「問題ありません」だけの報告、未実行検証の成功扱い、実ユーザー反応の捏造、理論名だけの指摘、P0の格下げ、未確認surfaceのreview済み表現を禁止します。

Pass / Fail、P0/P1/P2、target snapshot / ref、base / head、intent、追加・削除、影響surface、coverage、Introduced / Regression / Pre-existing、証跡、未実行検証、残るriskを明示します。latest meaningful changeに対する必須CI、利用可能なreview、未解決thread、mergeabilityはdelivery stateとして分けて確認します。

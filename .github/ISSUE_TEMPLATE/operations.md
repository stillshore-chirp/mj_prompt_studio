---
name: Operations / Runtime Investigation
about: 配布artifact、インストール済みアプリ、live API、local dataの調査
title: "[Ops]: "
---

## 事象・依頼内容

<!-- 何を調査・改善するか。 -->

## 対象環境

- local source / CI / packaged app / installed app / live OpenAI API:
- OS / version:
- mock / real LLM:
- local asset / local data:
- 発生日時または期間:

<!-- source code上の仮説と、packaged app・installed app・live OpenAI APIの観測事実を分ける。通常のtest / CIから実OpenAI APIを呼ばない。 -->

## 影響

<!-- 利用者影響、データ影響、公開安全性、運用影響。 -->

## 調査・対応判断の理由と根拠

<!--
なぜ今調査・対応するか。確認済み事実、ユーザーから提示された判断材料、仮説、未確認事項を分ける。
詳細: docs/ai-governance/14-issue-quality-gate.md
-->

## 現在のユーザー体験

- 対象ユーザー:
- 利用文脈・達成したいこと:
- 現在ユーザーが経験していること:
- ユーザー視点での認識・負担・感情:
- 結果として生じている体験状態:
- 根拠区分（該当するものを残す）: ユーザー申告 / 実ユーザー観察 / 観測事実からの推定 / 未確認の仮説

<!-- 未確認のユーザー主観を事実として断定しない。詳細: docs/ai-governance/14-issue-quality-gate.md -->

## 対応後に目指すユーザー体験

- 調査のみの場合に直接的な体験変化がないことと理由:
- 対応または後続判断を通じた体験上の変化:
- ユーザーが理解・判断・実行・回復できるようになること:
- 結果として目指す体験状態:
- その変化を確認する方法:

## 確認済み事実

<!-- ログや実データに基づく事実だけを書く。推測と混ぜない。公開Issueに載せる値は必要最小限にする。 -->

## 未確認事項

-

## 仮説

<!-- 仮説として明示する。断定しない。 -->

## 対応範囲

<!-- 調査、修正PR、ドキュメント化、監視、手順整備など。 -->

## 非対象

<!-- 今回は調査・変更しない環境、データ、運用範囲。 -->

## 受け入れ条件

- [ ] sourceと実環境の証跡を区別した。
- [ ] 事実と推測を分離した。
- [ ] secret、prompt、画像、DB・local asset・log原文、追跡IDを公開していない。
- [ ] 検証、残リスク、次の最短actionを明記した。

## 検証方針

<!-- local data、SQLite、installed app、live OpenAI API、pytest、dry-runなど。 -->
<!-- 実OpenAI APIを確認する場合は通常のtest / CIと分け、認証情報・prompt・responseを公開しない。 -->

## ロールバック・復旧方針

<!-- 必要な場合だけ。不要なら N/A と理由を書く。 -->

## 完了時に残す証跡

- PR本文:
- Issueコメント:
- docs/operations:
- CI / dry-run:
- その他:

## 公開安全性チェック

- [ ] 認証情報、Cookie、Authorization header、API keyを含めていない。
- [ ] 個人情報やユーザー入力全文を含めていない。
- [ ] prompt、画像、DB、local asset、response / log原文を貼っていない。
- [ ] request / trace / job / response IDやinstalled appのlocal pathを不要に公開していない。

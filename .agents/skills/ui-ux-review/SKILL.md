---
name: ui-ux-review
description: "アプリ本体またはリポジトリが制御する独自UIの変更・レビューで、ユーザー価値、状態、アクセシビリティ、視覚階層、コピー、熟練者効率、信頼感を証跡付きで確認する。"
---

# UI/UXレビュー Skill

## 発動条件と対象分離

アプリ本体UI（React client）の画面、ユーザー可視のAPI結果・status、文言、label、error、accessibility、responsive、E2Eを変更・レビューするときに使います。Issue、PR、Markdown、workflow説明などGitHub共同作業面だけの変更は、変更文・構造・link・公開安全性を確認します。両方にまたがる場合は、React UIの証跡とGitHub面の証跡を分けます。

## 準備

ルートと対象pathの `AGENTS.md`、関連Skill、現行UI、対象ユーザーとtask、変更前後の状態、API・Privacy・local asset境界を確認します。レビュー対象、viewport、browser、locale、mock data、未実施条件を記録し、実OpenAI APIや画像生成サービスを通常確認に使いません。

## React UIの確認

主要workflowごとに、initial、loading、empty、no-result、partial、validation-error、error、disabled、API unavailable、offline、cancelled、successを確認します。入力の保持・再試行・二重送信・非同期結果の取り違え・履歴への混入・Privacy mode・外部送信の境界を確認します。

視覚だけでなく、heading/landmark、label/name/role/value、keyboard操作、focus order・restore、dialog、screen reader、contrast、target size、zoom・responsive、reduced motionを確認します。階層、読み始め、copy、status/errorの可読性、繰り返し操作の効率、待機・成功・失敗・保存・破壊操作・API key・Privacyに対する信頼感をレビューします。

## GitHub共同作業面の確認

Issue/PR template、Markdown、workflow入力、review表示の変更では、rendered structure、link、文言、syntax、入力欄、公開可能性を確認します。アプリUI用のstate matrixやスクリーンショットを、GitHub面だけの変更へ機械的に要求しません。リンク先と権限・秘密情報の境界は公開安全Skillと揃えます。

## 証跡・優先度・終了

React UIでは必要なbefore/after screenshot、DOM・accessibility検査、focused test、manual workflow、state matrixを対象revisionへ結びます。GitHub面ではdiff、rendered Markdown/YAML、link、対象Issue/PRを結びます。prompt、参照画像、生成画像、response ID、secret、local path、実データを証跡にしません。

P0（操作不能、重大な誤送信・データ損失、主要accessibility阻害）は残したまま完了扱いにしません。P1は同じ変更で直すか、理由と追跡先を明記します。P2は記録し、影響と未確認を報告します。終了報告には対象HEAD、viewport/browser、実施確認、未実施確認、残るriskを含め、静的検査だけで実UIの見た目・desktop挙動・production状態を断定しません。

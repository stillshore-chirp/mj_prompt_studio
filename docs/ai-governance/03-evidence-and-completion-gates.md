# 証跡と完了ゲート

## 1. 対象面別の必須証跡

### アプリ本体UI

変更画面・状態、ユーザー価値、state matrix、初見simulation、accessibility、視覚階層、copy、熟練者効率、満足感・信頼感、反証review、実行・未実行検証、残リスクを記録します。

UI変更PRでは、該当画面・状態ごとの変更前と変更後のscreenshotをPR本文へ添付します。通常状態だけでなく、変更に関係するempty、loading、error、狭幅なども対象です。

### GitHub共同作業面

Issue / PR template、repository Markdown、workflow説明などでは、変更した文言・項目・順序・必須性、Markdown / form / YAML / frontmatter構造、link、公開安全性を確認します。GitHubが所有する未変更のplatform UIを検査対象に広げません。

### 混在

アプリ本体UIとGitHub共同作業面の証跡を分け、一方で他方を代用しません。

## 2. 成果物の判定

- ユーザー価値: 対象、文脈、目的、支援task、UIがない場合の困り事を説明できる。
- state matrix: 該当状態で、表示、理解、次行動、回復、a11y通知、証跡、Pass/Failを示す。
- 初見: 画面目的、現在地、最初の行動、結果予測、回復が分かる。
- accessibility: 自動検査だけでなく主要taskのkeyboard、focus、label/name、状態通知を確認する。
- 効率: 主要反復taskの手数、再入力、再選択、再試行、復帰、近道を確認する。
- 信頼: 待機、成功、失敗、危険操作、保存、外部送信、削除のfeedbackを確認する。
- 反証: P0と証跡不足を落とすつもりで探す。
- GitHub共同作業面: 第三者が項目の意味、必須性、次のaction、link先を理解できる。

## 3. 完了ゲート

次をすべて満たした場合だけ完了扱いできます。

- P0がない。P1は同じ変更内で修正済み、または明示的な延期根拠と追跡先がある。
- 対象面に応じた証跡がある。
- アプリ本体UIでは、ユーザー価値、初見理解、state matrix、a11y、視覚階層、copy、効率、信頼、反証reviewがある。
- screenshotが必須のUI変更では、変更前 / 変更後を本文で確認できる。
- 変更範囲に必要なlint、typecheck、test、build、E2E、手動確認が成功するか、未実行理由と残リスクがある。
- 実施していない検証や実ユーザーテストを実施済みとしない。
- PRではlatest meaningful changeの必須CI、利用可能な自動・手動review、未解決review threadを確認する。
- reviewが提供されない場合は代替自己reviewと未確認範囲を示す。

## 4. 証跡を取得できない場合

取得できない検証、理由、代替確認、残リスク、次の最短確認を記録します。前後screenshotを取得できないUI変更は、正本が必須とする場合、代替説明だけで完了にしません。

screenshotにはAPI key、prompt全文、参照画像、生成画像、local path、ユーザー情報など機微情報がないことを目視し、公開安全性Skillを適用します。

## 5. 推奨検証

lint、typecheck、unit / integration test、Playwright E2E、keyboard操作、axe等のa11y検査、狭幅、文字拡大、長文、visual diffを変更範囲に応じて選びます。

## 6. 報告

`templates/completion-gate-report.md` と `templates/uiux-review-report.md` を使います。証跡はPR本文、plan、または `docs/ai-governance/reports/` のtask固有reportへ残し、ユーザー資産を追跡しません。

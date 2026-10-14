# 証跡と完了ゲート

この文書は、MJ Prompt Studioのアプリ本体UIとGitHub共同作業面を区別し、変更を完了扱いするための証跡と判定条件を定義します。差分を伴うUI reviewでは、比較snapshot、追加・削除、影響coverage、変更意図、findingの由来を記録します。

## 1. 対象面

| 対象面 | 必要な証跡 |
|---|---|
| アプリ本体UI | React画面・state・操作・accessibility・前後差分 |
| GitHub共同作業面 | repositoryが制御する文言、構造、順序、必須性、link、公開安全性 |
| localhost APIを含む混在 | UIとAPIの契約・状態を別々に確認 |
| N/A | UIまたは共同作業面を変更しない理由 |

GitHubが所有しrepositoryが変更していないlayout、focus、permission stateはアプリUIと同じ証跡を要求しません。

## 2. 変更scopeの証跡
<!-- agent-harness:uiux-change-scope-evidence:start -->

差分を伴うUI reviewは、品質判定前に次を固定します。

| 項目 | 記録 |
|---|---|
| Target snapshot / ref | working tree、commit range、branch、PRと識別子 |
| Base / Head | 比較したbaseとheadのref / SHA |
| Commit / diff | commit数、staged / unstaged、追加側・削除側 |
| Diff identifier | patch hash、取得時点、sorted changed path set |
| Intent | Issue、PR、commit message、受け入れ条件から確認した変更意図 |
| Expanded surfaces | changed fileのconsumer、parent、route、state、代表surface |
| Coverage / unknowns | 確認したsurface、未確認consumer、除外理由 |

変更fileは証拠の入口です。shared primitive、global token、common component、themeの変更は代表consumerへ展開し、未確認範囲を残します。追加側と削除側を同じ重さで確認し、削除されたlabel、focus、state、recovery、responsive、copy、tokenに代替があるかを調べます。
<!-- agent-harness:uiux-change-scope-evidence:end -->

## 3. アプリ本体UIの証跡

変更範囲に応じて、対象ユーザー、目的、画面、component、入力、出力、初見理解、state matrix、accessibility、視覚階層、copy、熟練者効率、trust、反証review、test、手動確認を記録します。

アプリ本体UIの変更では、該当画面・stateの変更前と変更後のscreenshotを添付します。両方に対象画面、state、viewportなど表示条件を結び付け、UIに影響する変更後は画像を取り直します。

取得できない時は、未実行検証、理由、代替証跡、残るrisk、次の確認を示します。受け入れ条件上必須のscreenshotがない場合は完了扱いにしません。

## 4. フロー監査

フロー監査では、対象surface、ユーザー目的、開始・完了state、重要step、各stepの操作・到達stateを確認します。screenshotだけでaccessible name、contrast、focus順序、keyboard完走、時間変化、回復を確認済みとしません。完走不能または重要stepの証跡不足は、監査できた範囲と分けます。

## 5. findingの由来
<!-- agent-harness:uiux-finding-provenance:start -->

各findingをbase / head、diff、描画・操作・test証跡から分類します。

| status | 判定 |
|---|---|
| Introduced | head側の今回の変更が新しい問題を作った |
| Regression | baseで成立していた品質が今回の変更で弱くなった |
| Pre-existing | base側にも同じ問題があり、今回の変更が作成・弱体化していない |

IntroducedとRegressionは今回のP0 / P1 / P2、修正状態、証跡へ結び付けます。Pre-existingは通常の変更起因件数・責任から分離しますが、変更目的や安全性を阻害するblocking findingは完了可否とscopeへ残します。
<!-- agent-harness:uiux-finding-provenance:end -->

## 6. GitHub共同作業面

Issue / PR template、repository Markdown、workflow入力では、変更した文言、項目、順序、必須性、Markdown / YAML / frontmatter構造、link、command、公開安全性、preview要否を確認します。GitHubが所有する未変更UIのscreenshot、runtime、state matrixは要求しません。

## 7. 対象面別の受け入れ

アプリ本体UIでは、ユーザー価値、初見理解、主要state、accessibility、visual hierarchy、copy、効率、trust、反証review、必要なbefore / afterを確認します。差分reviewではscopeと追加・削除を見て、今回変更によるfindingを既存問題と区別します。

GitHub共同作業面では、変更した文言、構造、順序、必須性、link、公開安全性を確認します。UI用screenshotやdev serverは完了条件にしません。

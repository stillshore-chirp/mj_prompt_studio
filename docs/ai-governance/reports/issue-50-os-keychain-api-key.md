# UI/UXレビュー報告: Issue #50 保存済みOS資格情報ストアからAPI keyを再読み込み

## 概要

- 対象Issue / PR / 作業: [#50](https://github.com/stillshore-chirp/mj_prompt_studio/issues/50) / [#51](https://github.com/stillshore-chirp/mj_prompt_studio/pull/51) / SettingsのAPI key設定
- 画面・component・状態: Settings、API key入力、OS資格情報ストア保存・再読み込み、mock/実API、未発見・利用不可・失敗、keyboard、狭幅
- 判定: 再レビュー待ち
- P0 / P1 / P2件数: 0 / 0 / 0（初回P1/P2と再レビューP1を修正済み、再レビュー待ち）

## ユーザー価値

- 対象、文脈、支援task: API keyを一度OS資格情報ストアへ保存した利用者が、再入力やキー値の再表示をせず、Settingsから現在のセッションへ適用する。
- 助ける理解・判断・行動・回復: 「OS資格情報ストアから読み込んで使用」という結果が分かるbutton、key値を表示しない説明、成功・未発見/利用不可・例外時のstatusで、対象・影響・次行動を理解できる。
- UIがなければ困る点 / 削る候補: UIがなければアプリ再起動またはキー再入力が必要になる。環境変数・セッション適用・保存は既存導線として維持する。
- 検証仮説（未計測）: 保存済み資格情報の再利用により再入力手数と平文表示リスクを減らせる。実ユーザー評価は未実施。

## 初見・state matrix

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| 通常・保存済み未確認 | 対象を示すbuttonと、キー値を返さない説明 | 保存済みkeyを読み込む操作だと分かる | 読み込みbutton | 未発見なら既存設定を保持 | button accessible name、helper text | unit/E2E/screenshot | Pass予定 |
| 読み込み中 | 読み込みbuttonだけが`OS資格情報ストアを確認中…`となり、全key操作をdisabled | OS資格情報ストア確認中で重複操作できない | 待つ | 完了後statusを確認 | load buttonのdisabled/busy、既存入力保持 | unit | Pass |
| session保存中 | 読み込みbuttonは通常の文言のまま、全key操作をdisabled | セッション適用または保存中であり、資格情報ストア読込中とは誤認しない | 待つ | 完了後statusを確認 | disabled、正しいvisible label | unit | Pass |
| 成功 | セッション適用、キー値非表示のstatus、手入力欄を消去 | 現在のセッションだけに適用された | 接続テストまたはAI操作 | 既存のセッション適用導線 | `role=status` / `aria-live` | API/unit/screenshot | Pass |
| 未発見・利用不可 | 保存済みkeyがない/利用不可、設定変更なしのstatus | 既存設定は変わっていない | 保存またはセッション適用、OS設定確認 | 別の設定方法で再試行 | `role=status` / `aria-live` | API/unit/E2E | Pass予定 |
| 例外 | 読み込み失敗、設定変更なし、再試行案内 | 入力や既存設定は失われない | 保存またはセッション適用を再試行 | Settingsを離れず回復 | `role=status` / `aria-live` | unit | Pass予定 |
| mock mode | 外部API未接続の説明と読み込みbutton | 読み込み成功時のみ実APIモードへ変わる | 保存済みkeyの読み込み、またはmock継続 | keyなしならmockを維持 | mode説明、disabled/label | E2E/screenshot | Pass予定 |
| keyboard / 狭幅 | visible text button、既存responsive layout | iconだけに依存せず操作できる | Tab/Enterで実行 | 通常導線を維持 | focus、label、reflow | client lint/E2E | Pass予定 |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: buttonにvisible labelと、読込操作中だけの`aria-busy`を付け、処理中は全key操作をdisabledにする。成功・不成功は`role=status` / `aria-live`で通知する。client unitと隔離E2Eでlabel、disabled、keyboard到達、狭幅・文字拡大を確認した。
- 視覚階層（主操作、grouping、密度、狭幅）: 入力して適用する導線と、保存済み値を読み込む導線を同じAPI Key panel内に置き、説明を操作の直後に配置する。狭幅では既存のbutton折り返し・reflowを確認する。
- copy（用語、error、空、disabled、tone、禁止表記）: 「保存」ではなく「読み込んで使用」と結果を示す。失敗時に設定変更なしと次の操作を示す。特定のMidjourney version表記は追加しない。
- 熟練者効率（手数、保持、近道）: 保存済みkeyを再入力せず1操作で適用する。既存のsession入力・保存導線を削らない。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: key値を画面・HTTP response・ログへ返さないことを説明し、未発見/利用不可時も既存設定を変えない。読み込み成功時は残っていた手入力も消去する。OS保存済みkeyの適用と接続テストは、通常フォームから呼べない専用headerを必須にする。実OpenAI接続はこの変更で自動実行しない。
- 反証レビュー: keyring未導入相当、keyring例外、保存値なし、処理中の二重クリック、既存env/session設定、実値のDOM/response混入、狭幅時のbutton消失に加え、cross-origin formによるOS保存済みkey有効化、別操作中の誤ったloading文言、標準インストールにkeyringが含まれない場合を確認した。backend contract/unitとclient unit/E2Eで回帰を固定した。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P1 | `load-persisted-api-key` / `connection-test` | bodyなしPOSTを通常フォームから送信でき、OS保存済みkeyの有効化や外部接続を誘発できる | 意図しない資格情報利用・課金 | `X-MJPS-Request`必須化、CORS許可header、headerなしは403、回帰test | 修正済み・再レビュー待ち |
| P2 | Settings key操作のloading表示 | session適用・保存中にも、資格情報ストア読込中と表示した | 状態の誤認 | 実行中のkey操作を個別状態化し、load操作だけ文言/`aria-busy`を変更 | 修正済み・再レビュー待ち |
| P1 | `pyproject.toml` | 標準インストールに`keyring`が含まれず、読み込み機能が常に利用不可になる | 保存済みkeyを再利用できない | production dependencyへ`keyring`を追加し、package宣言を回帰testで固定 | 修正済み・再レビュー待ち |

## 証跡・検証

- 変更前/変更後screenshot: API key未入力・safe mock状態でSettingsを撮影し、変更前は再読み込みbuttonなし、変更後はbuttonと説明・通常状態を比較した。API key、prompt、画像、local path、ユーザー情報がないこととsRGB metadataを確認し、PR本文へ添付する。
- test / trace / 手動確認: backend unit/contract（headerなし403と設定不変、headerあり成功）、Settings component（手入力消去、操作別loading）、`python -m pip install -e ".[dev]"`による標準セットアップ相当でのkeyring導入、package宣言回帰test、client lint/typecheck/test/build、隔離E2E 20件（未保存keyの安全な回復を含む）、API key混入検索、狭幅・文字拡大・keyboard確認を実施した。
- Codex review: `d02bd0683a` に対するGitHub Codex reviewがP1/P2を検出し、`3f5eb5a`への再レビューがP1（標準インストールのkeyring依存）を検出した。各修正後のheadは再レビュー待ち。
- 実OpenAI API・実OSのcredential backend・実ユーザー評価: CI/通常テストでは未実施。実環境でのKeychain/Credential Manager/Secret Serviceの対話・権限差は後続の手動確認が必要。

| 未実行検証 | 理由 | 残リスク | 後続 |
|---|---|---|---|
| 実OS資格情報ストアへの保存済み値での取得 | 実ユーザーの秘密情報を使わず、CIでOS差を再現しない方針 | OSごとのbackend許可ダイアログや取得差 | 非機微な専用test credentialで各OS手動確認 |
| 実OpenAI API接続 | 通常テストとCIで外部APIを呼ばない | 実接続時の応答・ネットワーク差 | 明示opt-inのcredentialed smoke |
| 実ユーザー評価 | 今回の実装・契約検証の範囲外 | 実利用頻度・理解度は未計測 | UX research planに従い安全fixtureで評価 |

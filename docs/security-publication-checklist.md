# ドキュメント公開セキュリティチェックリスト

gitへpushするMarkdown、text、sample、report、plan、Issue/PR本文、screenshot、検証log要約へ秘密情報や不要な攻撃材料を残さないための基準です。

## 公開してはいけないもの

| 種別 | 禁止例 | 安全な置換 |
|---|---|---|
| 認証情報 | API key、token、password、private key、OAuth secret | `<redacted>`、環境変数・資格情報storeで管理 |
| session | Cookie、Authorization header、JWT、signed URL | `認証headerを確認` |
| 個人・ユーザー情報 | 氏名、mail、IP、prompt全文、問い合わせ、ユーザーID | `対象ユーザー`、`該当入力` |
| ユーザー資産 | 参照画像、生成画像、制作prompt、local DB、asset path | 安全なfixture、抽象化した説明 |
| 実運用識別子 | private URL、host、完全なlocal path、request/trace/job/response ID | `対象endpoint`、`対象job` |
| log原文 | request/response、stack trace、OpenAI response dump全文 | 必要な観測事実だけを要約 |
| screenshot metadata | account名、通知、path、秘密値、不要なEXIF | crop、mask、安全なfixture、metadata除去 |

commit/push前に削除、mask、公開可能な抽象表現へ置き換えます。既に公開sourceにあるfile path、関数名、公開API path、commit SHA、PR番号、check名、秘密を含まないerror種別や状態遷移は記載できます。

## 運用・実API記録

実OpenAI API、配布artifact、インストール済みアプリ、ユーザーdataを根拠にする場合、`観測事実`、`判断`、`対応`、`残リスク`へ要約します。response ID、request ID、prompt、画像、秒単位時刻、完全な調査commandを不要に公開しません。正確な値が必要ならprivate記録へ残し、公開理由をPRへ書きます。

## screenshot

- 表示内容を目視し、API key、prompt、画像、account、通知、pathがないことを確認する。
- 安全性を確認できない画像は公開せず、情報種別と未確認理由を説明する。
- UI変更のbefore/after画像自体を公開artifactとして一覧に含める。
- image metadataの確認・除去要否を判断する。

## 公開承認ゲートで停止した場合

承認を求める前に、公開先と操作、対象file/画像/commentの完全一覧、安全に示せる実物または差分、具体的検出か予防停止か、実施したsecret・個人情報・画像検査、未確認範囲、推奨判断、承認後の閲覧範囲と回復可否を示します。

秘密・個人情報の値自体を承認材料として再表示しません。具体的に検出した場合は原文公開の許可を求めず、削除・mask・rotate/revokeなどを先に行います。具体的検出がなく外部送信だけで停止した場合は予防的確認と明記します。

## 漏洩時

push前なら削除してからcommitします。push後は削除だけでなくsecretのrotate/revoke、影響調査、履歴対応を検討します。他所で既公開でも再拡散しません。

## 最低限の確認

- `git diff --check`
- staged/unstaged差分の目視
- 差分内の `secret`, `token`, `password`, `cookie`, `Authorization`, `Bearer`, `client_secret`, `private_key`, `request_id`, `trace_id`, `job_id`, `response_id`, `OPENAI_API_KEY` 検索
- screenshotの表示内容とmetadata確認
- URL、path、日時、IDが公開に必要な粒度か確認

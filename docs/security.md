# Security and Privacy

gitへ公開する文書、plan、Issue/PR本文、screenshot、検証log要約は、本文書に加えて `docs/security-publication-checklist.md` を確認する。

## APIキー

- `OPENAI_API_KEY` は端末の環境変数または標準依存の`keyring`を通じたOS資格情報ストアから読む。
- 互換用に `OPENAI_KEY` と `MJPS_OPENAI_API_KEY` も環境変数として読み取れる。
- 平文設定ファイルへの保存は既定にしない。
- Settingsから保存済みのOS資格情報ストアのkeyを再読み込みする場合も、API keyはserver内でセッションへ適用し、clientの画面・HTTP response・ログへ返さない。
- Job、ログ、エクスポート、スクリーンショットにAPIキーを出さない。

## ローカル資産

- 参照画像と生成結果画像はユーザーが手動で取り込む。
- asset storeはローカルアプリデータ領域に作成する。
- React UIはfile picker / drag and dropで `File` を受け取り、localhost APIへuploadする。
- 画像previewは `/api/assets/references/{reference_id}` と `/api/assets/results/{result_image_id}` から返す。任意pathは受け付けない。
- file uploadは拡張子、MIME、サイズ上限を検証する。
- 画像そのもの、DB、cache、log、export、API response dumpはgit追跡対象外。

## Local API

- APIは既定で `127.0.0.1` にのみbindする。
- CORSはReact dev / preview originに限定する。
- OS資格情報ストアからのkey適用と実API接続テストは、React clientだけが付与する `X-MJPS-Request` headerを必須にし、通常のcross-origin form POSTを403で拒否する。
- React UIはtyped API clientだけを使い、SQLite、AssetStore、SecretStore、OpenAI SDKを直接扱わない。
- HTTP response、Job payload、console logにAPI key、Token、Cookie、画像本文、prompt全文を含めない。
- Settings、Health、Jobs、公開用証跡には、設定モード・実行バックエンド・キー設定有無・応答ID種別と、安全な失敗分類だけを出す。APIキー、実Response ID、OS資格情報ストア由来の値や例外原文は出さない。
- Prompt WorkshopのJob入力snapshotは、Prompt本文・任意ガイダンス・除外語句を含めず、文字数、件数、mode、設定有無だけを保存する。除外語句の文字列はJobログ、公開文書、スクリーンショットのfixtureに含めない。

## 外部送信

- 画像解析や結果レビューを実行した場合のみ、必要な画像と最小限のメタデータをLLMへ渡す。
- Privacy modeではResponses APIの保存を無効化し、会話ID継続を使わない。
- 通常モードでも、保存モデルが `gpt-5.6-luna` と一致しない旧会話IDは送信しない。
- LLM計測にはAgent名、token usage、latency、画像入力数、再試行数、schema成否、response ID有無だけを使い、APIキー、prompt本文、画像内容を含めない。
- connection testと代表Agentの実API手動検証は `OPENAI_API_KEY` を設定した環境でだけ行う。通常テストとCIは `MJPS_LLM_MODE=mock` を明示したフェイク経路だけを使う。
- Prompt Workshopの実API手動検証は、テスト専用の一般的な入力だけを使い、ユーザーの制作Prompt、除外語句、画像を送信しない。

## 生成サービス境界

禁止:

- Web/Discord/Botの自動操作。
- ログイン自動化。
- Cookie、Token、Session取得。
- 非公式API、自動投稿、ブラウザ自動クリック。

許可:

- ユーザーによる手動コピー、手動貼り付け、手動アップロード。
- ユーザーがローカルへ保存した画像の手動取り込み。

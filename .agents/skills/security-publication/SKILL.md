---
name: security-publication
description: "公開リポジトリへpushされる文書、Issue、PR、レポート、ログ要約、サンプル、スクリーンショットを作成・更新する時に、秘密情報や追跡可能な運用情報の露出を防ぐ。"
---

# 公開安全 Skill

## 発動条件

公開repoのdiff、Issue、PR、docs、report、log summary、sample、fixture、screenshot、trace、workflow説明を作成・更新・レビューするときに使います。公開先、branch、変更path、想定読者を先に固定します。

## 公開前インベントリ

新規・変更・生成ファイルを列挙し、source、fixture、ログ、画像、metadata、リンク、環境設定、埋め込み出力を確認します。秘密情報、API key、access token、Cookie、authorization header、private key、credential、個人情報、prompt、参照画像、生成画像、local DB/asset、raw log、query、絶対path、時刻、request/response ID、環境ID、追跡可能な識別子を公開物へ残しません。

## 検査

- staged/unstaged diff、新規ファイル、ignore漏れ、履歴由来の生成物を確認する。
- secret scannerと文字列検索を実行し、hidden file、コメント、metadata、alt text、fixture、screenshot、URL queryにも同じ基準を適用する。
- Markdown link、Issue/PR本文、YAML、code block、sampleのsyntaxと公開先を確認する。
- logはraw貼付を避け、必要な事象をsyntheticな値と最小の時刻・分類へ置換する。スクリーンショットは画像内容、OCR可能な文字、metadataを確認する。
- `git diff --check` と、対象path・artifact・実行条件に結び付いた検査結果を記録する。

## 検出時の扱い

漏えい候補を見つけたら公開を止め、値そのものを再掲せず、種類・場所・影響だけを記録します。実credentialなら公開範囲を確定し、rotation/revocationを担当者へ直ちに引き継ぎます。削除後も履歴、artifact、cache、Issue/PR、添付画像への残存を確認するまで安全扱いにしません。

## 報告と境界

報告には公開先、対象revision、検査範囲、pass/fail、除去・マスク方針、未確認、残るriskを含めます。未確認のscanner、履歴、外部権限、公開状態を成功と断定しません。公開文面・workflow・Issue/PRはコードと別のGitHub共同作業面としても確認し、実OpenAI API、画像生成サービス、Cookie、Token、非公式APIを操作しません。

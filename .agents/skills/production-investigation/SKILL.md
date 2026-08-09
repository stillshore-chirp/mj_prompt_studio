---
name: production-investigation
description: "配布artifact、インストール済みアプリ、実OpenAI API、SQLite・asset store・OS資格情報ストア、GitHub Actionsの実挙動を、観測証跡とコード上の仮説を分離して調査する時に使う。"
---

# 実環境調査 Skill

## 発動条件

利用者が、配布artifact、インストール済みアプリ、実OpenAI API、実ローカルデータ、OS資格情報ストア、CI・package後の挙動に関する調査を求めた場合に使います。source codeとmockだけで完結する不具合修正には必須ではありません。

## 1. 調査契約

- 調査対象、影響、発生時間帯、期待挙動、利用可能な環境を特定する。
- code、設定、mock、local unit testだけで実環境状態を断定しない。
- 実artifact、実アプリ、実API、実dataを確認した事実だけを「実環境で観測」と表現する。
- 確認できない範囲は、code上の仮説、再現条件、未確認事項として分離する。

## 2. 証跡

状況に応じて次を確認する。

- package / release artifactのcommit、build条件、対象OS、起動結果
- インストール済みアプリのversion、設定mode、再現操作、安全な状態表示
- GitHub Actionsのworkflow run、job、check、artifact
- 実OpenAI APIのstatusと、アプリが保持する安全なfailure category
- SQLite schema、対象recordの存在・整合性、asset storeとの参照関係
- OS資格情報ストアの利用可否と、値を表示しない取得結果
- source実行と配布環境の設定差

調査メモには、何を、どの環境で、どの時間範囲・条件で確認したかを残す。公開物には追跡可能な実識別子、credential、prompt、画像、DB・ログ原文を載せない。

## 3. 安全性

- read-only確認を優先する。
- DB・asset変更、資格情報変更、再package、release、artifact公開は、影響を説明して明示的な権限を得てから行う。
- API key、token、認証header、PII、prompt全文、画像内容を表示・記録しない。
- query結果やlogを外部LLMへ渡す場合は、最小化とマスキングを先に行う。
- 公開Issue、PR、運用文書を作る場合は公開安全性Skillも適用する。

## 4. 原因判定

原因を断定するには、少なくとも次を接続する。

1. 観測された失敗または異常
2. その失敗を説明するcode・設定・data
3. 再現、対照確認、修正後確認のいずれか
4. 他の主要仮説を除外した根拠

接続できない場合は「最有力仮説」または「未特定」と報告する。

## 5. 報告

- 観測事実
- 影響範囲
- 原因または仮説と確度
- 実施した対応
- 実施していない操作
- 残るリスク
- 次の最短アクション

実環境へ到達できなかった場合は、到達不能の理由、確認済みのsource / mock範囲、残る不確実性を明記する。

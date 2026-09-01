# Operations AGENTS.md

ルート [AGENTS.md](../../AGENTS.md) を先に適用し、この文書はCI、配布、package、release、実行環境調査に固有の契約だけを追加します。

実環境を調査・記録する場合は [実環境調査Skill](../../.agents/skills/production-investigation/SKILL.md)、公開記録やPR本文を作る場合は [公開安全性Skill](../../.agents/skills/security-publication/SKILL.md) を適用します。

## Hard gate

- 配布artifact、インストール済みアプリ、実OpenAI API、実ローカルデータを確認していない内容を実環境の事実として扱いません。
- API key、credential、PII、prompt・画像・DB・log原文、local path、追跡可能IDを記録・公開しません。
- release、artifact公開、credential・権限変更、破壊的なlocal data操作は明示された権限の範囲内だけで実行します。
- workflow、package、release設定を変えた場合は構文検査、shellcheck、dry-runまたはbuildを実行します。
- 実行できない検証は、理由と残るriskを最終報告へ記録します。

## 検証

- .github/workflows/** はYAML構文、permissions、branch / path条件、secret参照、concurrency、timeoutを確認します。
- shell scriptは bash -n と利用可能な場合の shellcheck を実行します。
- packageまたは配布形式を変える場合は make package と対象OSで未確認の範囲を明記します。
- 本番操作を伴わないPRでは静的検証とlocal buildを使い、配布済み・動作確認済みと表現しません。

## 記録

観測事実、推定、判断、対応、残るriskを分け、確認元を後から追える粒度で記録します。公開文書には必要な事実だけを要約し、運用識別子を残しません。

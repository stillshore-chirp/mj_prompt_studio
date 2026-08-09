# Operations AGENTS.md

ルート [`AGENTS.md`](../../AGENTS.md) を先に適用し、この文書はCI、配布、package、release、実行環境調査に固有の契約だけを追加します。

実環境の事象を調査・記録する場合は、作業前に [実環境調査Skill](../../.agents/skills/production-investigation/SKILL.md) を読みます。公開される記録やPR本文を作る場合は、併せて [公開安全性Skill](../../.agents/skills/security-publication/SKILL.md) を適用します。

## Hard gate

- 配布artifact、インストール済みアプリ、実OpenAI API、実ローカルデータを確認していない内容を、実環境で観測した事実として扱わない。
- API key、credential、個人情報、prompt・画像・DB・log原文、local path、追跡可能IDを記録・公開しない。
- release、artifact公開、credential・権限変更、破壊的なlocal data操作は、明示された権限の範囲内だけで実行する。
- workflow、package script、release設定を変えた場合は、対象に対応する構文検査、shellcheck、dry-runまたはbuildを実行する。
- 実行できない検証は、理由と残るリスクをPRと最終報告へ記録する。

## 検証

- `.github/workflows/**` ではYAML構文、permissions、branch / path条件、secret参照、concurrency、timeoutを確認する。
- shell scriptでは `bash -n` と利用可能な場合の `shellcheck` を実行する。
- packageまたは配布形式を変える場合は `make package` と、対象OSで未確認の範囲を明記する。
- 本番操作を伴わないPRでは静的検証とlocal buildを使い、配布済み・動作確認済みと表現しない。

## 記録方針

- 観測事実、推定、判断、対応、残リスクを分離する。
- GitHub Actions、artifact、commit、設定、再現条件など、確認元を後から追える粒度で記録する。
- 公開文書には必要な事実だけを要約し、正確なlocal path、秒単位時刻、完全なquery、実request / response / job IDを残さない。

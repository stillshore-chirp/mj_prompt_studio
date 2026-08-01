# Issue #17: Result Reviewを選択画像と正しく関連付ける

## 目的

選択中の結果画像と異なるAI Reviewを表示・適用しないようにする。

## 対象範囲

- 結果画像ごとの保存済みAI Review読込と表示
- 比較・Final Auditの対象範囲の明示
- 安全fixtureによる画像切替回帰

## 受け入れ条件

- [x] 選択画像と異なるreviewを表示しない。
- [x] review、比較、auditが対象画像または適用範囲を明示する。
- [x] 選択変更後に保存済み結果または再実行案内を表示する。

## 検証

- `make client-lint && make client-typecheck && make client-test && make client-build`
- 隔離mock E2E: `npx playwright test e2e/result-review-association.spec.ts -c .tmp/issue-13-e2e.config.ts`
- `git diff --check`、`bash scripts/verify-ai-governance.sh`

## リスク

- 実ユーザー画像は使用せず、fixture画像のみをE2Eで使う。

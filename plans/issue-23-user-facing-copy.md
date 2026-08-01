# Issue #23: 内部用語を排した対象・結果中心のUI copy

## Issue

- Issue: `#23`

## タスク分類

- UI/UX / アクセシビリティ / コピー / 状態・エラー・待機

## 目的

制作ユーザーが内部field path・raw JSON・Agent名を知らなくても、変更対象、影響、結果、回復を判断できるようにする。

## 非目標

- domain model/API schemaの名前変更、LLM出力形式の変更、技術詳細の削除ではなく主要情報からの分離。

## 対象範囲

- Patch/parameter確認、Prompt Doctor、AI Inspector、Jobs、主要status/button copy
- 日英用語の一貫性とcopy回帰テスト

## マイルストーン

- [x] 制作語へのdisplay mappingと確認内容を実装する。
- [x] 対象・結果・回復を示すcopyへ統一する。
- [ ] UI/UX証跡、検証、PR/CI/reviewを完了する。

## 受け入れ条件

- [x] ユーザー可視confirmationで内部field pathやraw JSONを主要情報にしない。
- [x] 操作labelが対象と結果を表す。
- [x] errorとsuccessが原因・影響・次行動を示す。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `npx playwright test -c .tmp/issue-13-e2e.config.ts`（client配下）
- `git diff --check && bash scripts/verify-ai-governance.sh`

## 既知 blocker

- なし

## 仮定・未確認事項

- 技術詳細が必要な利用者には、ユーザー可視の主要判断情報ではなく開発者向けログを使う。今回新たな詳細UIは追加しない。

## UI/UX 証跡

- `docs/ai-governance/reports/issue-23-user-facing-copy.md`
- PRコメントへMock fixtureのみの前後スクリーンショットを添付する。

## feature flag / rollback

- display copyとmappingのみを変更し、通常のgit revertで戻せる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `make client-lint && make client-typecheck && make client-test && make client-build` | Pass | unit 30 tests、production build成功 |
| 2026-08-02 | `npx playwright test -c .tmp/issue-13-e2e.config.ts` | Pass | 隔離Mock E2E 15 tests |
| 2026-08-02 | 前後画面の目視確認 | Pass | Mock fixtureのみ、内部path/raw JSONの主要表示なし |

## PR / CI / review 記録

- Branch: `codex/improve-copy-feedback`
- Commit: 未作成
- PR: 未作成
- Push CI: 未実行
- PR CI: 未実行
- Codex review: 手動差分レビュー済み。PR後に再確認する。
- 未解決 review thread: PR後に確認する。
- レビュー往復回数: 0

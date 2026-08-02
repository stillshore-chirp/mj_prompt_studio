# Issue #64 ユーザーマニュアル再構成

## Issue

- Issue: [#64](https://github.com/stillshore-chirp/mj_prompt_studio/issues/64)

## タスク分類

- コピー / 文書のみ（ただしアプリ内ヘルプで表示するユーザー可視コンテンツ）

## 目的

- 初見利用者が、機能の存在理由、使う・使わない判断、操作後の結果、次の行動を理解できるユーザーマニュアルへ再構成する。

## 非目標

- アプリ機能、AI実行ポリシー、外部画像生成サービスへの手動投入という境界を変更しない。
- Quick Startを詳細マニュアルへ肥大化させない。
- 実API、実ユーザーデータ、実画像を用いた検証を行わない。

## 対象範囲

- `docs/user-manual.md` の全面再構成
- アプリ内ヘルプでの表示・画面別ジャンプの回帰確認
- `docs/ai-governance/reports/issue-64-user-manual.md` のUI/UXレビュー証跡
- 必要最小限のHelp Widget回帰テスト

## マイルストーン

- [x] 現行マニュアル、UI仕様、主要画面実装、ヘルプ表示実装を照合する。
- [x] Issue #64を作成し、目的・非対象・受け入れ条件・リスクを記録する。
- [x] 目的→判断→準備→結果→手順→注意点の構造でマニュアルを再構成する。
- [x] アプリ内ヘルプでの文書表示・画面別ジャンプを回帰テストする。
- [x] UI/UXレビュー、公開安全性、ローカル検証を完了する。
- [x] 変更をレビューし、コミット・push・Ready PR・CI・review threadを確認する。

## 受け入れ条件

- [x] 制作フローと、外部画像生成サービスへの手動投入の理由・境界が分かる。
- [x] 主要機能ごとに、存在理由、使う・使わない判断、操作後の結果、最短手順、注意点または回復方法がある。
- [x] AI実行、画像分析、API key、Privacy mode、削除・再実行の影響と次の行動を正確に説明する。
- [x] 実装済みの画面文言・挙動との照合結果を残し、存在しない自動化や保証を記載しない。
- [x] Help Widgetの見出しジャンプが機能し、更新された文書内容を表示する。
- [x] UI/UX証跡、変更前後の安全なスクリーンショット、公開安全性検査を残す。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知 blocker

- GitHub CLIの認証は無効。Issue、PR、CI、review threadはGitHub connectorを使って確認する。

## 仮定・未確認事項

- 実ユーザーによる理解度は未計測。実装に基づく初見シミュレーションと固定テストで評価し、実ユーザーテスト済みとは主張しない。
- 手順のみを求めるQuick Startは現行の役割を維持し、詳細な判断支援はユーザーマニュアルへ置く。

## UI/UX 証跡

- 対象: 右下の「使い方」panelに表示されるユーザーマニュアル。
- state matrix、初見、a11y、視覚階層、copy、効率、信頼、反証: `docs/ai-governance/reports/issue-64-user-manual.md`
- 前後screenshot: `docs/ai-governance/evidence/issue-64/`

## feature flag / rollback

- 文書・テスト・証跡だけの変更。問題があれば当該コミットをrevertして前のマニュアルへ戻せる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | 現行文書・UI仕様・主要画面・Help Widget照合 | Pass | マニュアルの主要節は手順中心、画面実装には目的・使う場面の説明あり。 |
| 2026-08-02 | `make client-lint` | Pass | ESLint成功。 |
| 2026-08-02 | `make client-typecheck` | Pass | TypeScript型検査成功。 |
| 2026-08-02 | `make client-test` | Pass | 最新main統合後に15 files / 51 tests成功。 |
| 2026-08-02 | `make client-build` | Pass | production build成功。 |
| 2026-08-02 | `npx playwright test e2e/help-widget.spec.ts` | Pass | Mockデータ・専用portで2件成功。目的・使い分けの表示と画面別ジャンプを確認。 |
| 2026-08-02 | `make e2e` | Pass | 最新main統合後、専用portで24件成功。sandbox内のport bind拒否後、制限外で再実行した。 |
| 2026-08-02 | `make lint` / `make typecheck` / `make test` / `make build` | Pass | 最新main統合後にPython lint・型検査・70 tests・build成功。testには既存のStarlette deprecation warningが1件。 |
| 2026-08-02 | `bash scripts/verify-ai-governance.sh` | Pass | AI governance検証成功。 |
| 2026-08-02 | `git diff --check` / 公開安全性目視 | Pass | whitespace errorなし。新規文書・証跡に秘密値、個人情報、ユーザー資産、実行IDを含めないことを確認。 |
| 2026-08-02 | Mock起動でのHelp Widget表示確認 | Pass | 変更前後screenshotを取得し、rendererが見出し・箇条書きを正しく表示することを確認。 |

## PR / CI / review 記録

- Branch: `codex/rebuild-user-manual`
- Commit: `d796d4e`（ユーザーマニュアルを目的別に再構成）
- PR: [#66](https://github.com/stillshore-chirp/mj_prompt_studio/pull/66)（Ready）
- Push CI: `ci.yml`は`main` / `master`だけを対象にするため、作業ブランチpushでは設定どおり起動対象外。mergeはユーザー未指示のため未実施。
- PR CI: run 160（pull_request）成功。Quality and package、macOS smoke、Windows smokeがすべて成功。
- Codex review: stage済み差分を目的・正確性・公開安全性・UI/UX証跡の観点で確認し、P0 / P1なし。
- 未解決 review thread: 0（GraphQL確認）
- レビュー往復回数: 0

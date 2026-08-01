## Issue

- Issue: [#29](https://github.com/stillshore-chirp/mj_prompt_studio/issues/29)

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / コピー / 状態・エラー・待機

## 目的

Composerの反復操作を、ブラウザ・OS予約と入力中の誤発火を避けながらkeyboardで実行可能にする。

## 非目標

- 全画面・全操作へのshortcut割当
- browser/OSの予約shortcut（保存ページ、閉じる、印刷など）の上書き
- textarea編集中のcompile/copyなどの実行

## 対象範囲

- Composerの保存、Compile、Compiled Promptコピー
- `Alt+Shift+S`、`Alt+Shift+Enter`、`Alt+Shift+C` の発見性、a11y属性、keyboard回帰test

## マイルストーン

- [x] Issue・既存操作・UI/UXガバナンスを確認する。
- [x] shortcutの入力境界、表示、state matrix、反証観点を決める。
- [x] Composerとunit/E2Eを実装する。
- [ ] 前後スクリーンショット、ローカル検証、PR/CI/reviewを完了する。

## 受け入れ条件

- [x] 保存、Compile、コピーがkeyboardで実行できる。
- [x] textarea編集中に意図しない実行をしない。
- [x] shortcutと代替buttonの両方を提供する。

## 検証コマンド

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make e2e`
- `make client-build`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知 blocker

- なし

## 仮定・未確認事項

- `Alt+Shift`の3操作はbrowser/OS予約の保存・閉じる・印刷・開発者ツールを上書きしない最小セットとする。特定のOS入力方式との実利用互換性は実ユーザー検証で確認する。

## UI/UX 証跡

- report: `docs/ai-governance/reports/issue-29-safe-keyboard-shortcuts.md`
- 変更前/後: 安全なmockデータで撮影し、PR本文へ添付する。
- state matrix: 上記reportに記録する。

## feature flag / rollback

- clientのイベント処理と表示だけの変更であり、通常のgit revertで戻せる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `make client-lint` | PASS | ESLint |
| 2026-08-02 | `make client-typecheck` | PASS | TypeScript |
| 2026-08-02 | `make client-test` | PASS | 14 files / 39 tests。保存・Compile・コピー、有効条件、textarea中の非発火、a11y属性を含む。 |
| 2026-08-02 | `make e2e` | PASS | 20 tests。実ブラウザでtextarea中の非発火、入力欄外の保存・Compile、コピー有効化を確認。 |
| 2026-08-02 | `make client-build` | PASS | production build |
| 2026-08-02 | `git diff --check` | PASS | 空白エラーなし |
| 2026-08-02 | `bash scripts/verify-ai-governance.sh` | PASS | governance verification |
| 2026-08-02 | mock UI screenshot | PASS | 変更後を目視。shortcut案内、button代替、disabled状態、通常幅を確認。狭幅はE2E `narrow-layout-reflow` で横overflowなし。 |

## PR / CI / review 記録

- Branch: `codex/add-safe-keyboard-shortcuts`
- Commit:
- PR:
- Push CI:
- PR CI:
- Codex review:
- 未解決 review thread:
- レビュー往復回数:

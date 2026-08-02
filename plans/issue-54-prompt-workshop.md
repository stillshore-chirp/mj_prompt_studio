## Issue

- Issue: `#54`（親Epic。子Issue `#55`〜`#60` を依存順で統合）

## タスク分類

- UI/UX / アクセシビリティ / frontend挙動 / 状態・エラー・待機 / backend / API / LLM / 永続設定 / 文書

## 目的

- 材料なしのPrompt生成と既存Promptの再構成を、固定LLM実行ポリシー・共通出力設定・安全なJob導線で利用可能にする。

## 非目標

- Prompt本文コーパス、CSV/DB管理、動画Prompt、外部ストレージ、画像生成サービスの自動操作、LLM実行設定の可変化は追加しない。

## 対象範囲

- #55: Midjourneyオプションをテキスト出力へ付ける永続設定と共通renderer。
- #56: 入力なしPrompt GeneratorとPrompt Workshop基盤。
- #57: 除外語句の永続設定と創作系出力の検証。
- #58: 世界観整形・カオスミックスとアンカー保持。
- #59: 意味とスタイルを維持する文字数調整。
- #60: 組み込みプリセット、強度、任意ガイダンス付きLLMアレンジ。

## マイルストーン

- [x] #55 共通Prompt出力policy、設定、既存出力経路を実装・検証する。
- [x] #56 Prompt Generator、strict schema、MockLLM、Job/APIを実装・検証する。
- [x] #57 除外語句の正規化、保存、適用・失敗契約を実装・検証する。
- [x] #58 世界観整形・カオスミックス、#59 文字数調整を実装・検証する。
- [x] #60 組み込みpreset catalog、アレンジ、結果操作を実装・検証する。
- [x] Prompt Workshop UI、型付きAPI/OpenAPI、利用者文書、UI/UX証跡を完成させる。
- [ ] 全品質ゲート、公開安全性、Ready PR、CI、review thread確認を完了する。

## 受け入れ条件

- [x] Issue #54および子Issue #55〜#60の受け入れ条件を満たす。
- [x] 新規LLM経路は固定実行ポリシー、strict schema、MockLLM、Job Queue、Privacy modeへ適合する。
- [x] 出力本文・除外語句・任意ガイダンス等のユーザー資産を公開証跡へ残さない。
- [x] UIの通常、空、queued/running、部分成功、失敗、再試行、長文、複数結果、狭幅、文字拡大を確認する。

## 検証コマンド

- `make lint`
- `make typecheck`
- `make test`
- `make build`
- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make generate-openapi`
- `make e2e`
- `make package`
- `make verify-governance`
- `git diff --check`

## 既知 blocker

- なし。GitHub CLIは制限外で認証済み。

## 仮定・未確認事項

- 実OpenAI APIの品質・レイテンシ・消費量はopt-in実APIスモーク以外では確認しない。通常のテストとCIはMockLLMで固定する。
- UI証跡は架空の短いfixtureとMockLLMだけを使用する。

## UI/UX 証跡

- 保存先: `docs/ai-governance/evidence/issue-54/` および `docs/ai-governance/reports/issue-54-prompt-workshop.md`
- 対象: Prompt WorkshopとSettingsの変更前後、空、処理中、結果、失敗、狭幅状態。

## feature flag / rollback

- feature flagは追加しない。変更は責務ごとのコミットに分け、通常のgit revertで復旧できるようにする。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-08-02 | `make lint` / `make typecheck` / `make test` / `make build` | PASS | Ruff、mypy（53 files）、pytest（63 passed）、package buildを確認。 |
| 2026-08-02 | `make client-lint` / `make client-typecheck` / `make client-test` / `make client-build` | PASS | ESLint、TypeScript、Vitest（15 files / 49 tests）、Vite buildを確認。 |
| 2026-08-02 | `make generate-openapi` / `git diff --check` | PASS | 型付きclient contractを再生成し、空白エラーなし。 |
| 2026-08-02 | `MJPS_E2E_API_PORT=18065 MJPS_E2E_CLIENT_PORT=18066 make e2e` | PASS | 隔離Mock環境のPlaywright 22 tests。通常、非同期job、結果操作、狭幅、文字拡大を確認。 |
| 2026-08-02 | `make package` / `make verify-governance` | PASS | wheel/tarへpreset JSONを含むこと、AI governance検証を確認。 |

## PR / CI / review 記録

- Branch: `codex/issue-54-prompt-workshop`
- Commit:
- PR:
- Push CI:
- PR CI:
- Codex review:
- 未解決 review thread:
- レビュー往復回数: 0

# Issue #29 Composer shortcut UI/UXレビュー

## 概要

- 対象Issue / PR / 作業: #29 / 作業中 / Composerの保存・Compile・コピー
- 画面・component・状態: Composer、shortcut案内、保存・Compile・コピー、有効/無効、textarea編集、keyboard focus、狭幅、文字拡大
- 判定: PASS（PR / CI / review待ち）
- P0 / P1 / P2件数: 0 / 0 / 0

## ユーザー価値

- 対象、文脈、目的、支援task: Composerを反復利用する制作者が、pointerへ移動せず保存・Compile・コピーを実行する。
- 助ける理解・判断・行動・回復: visible buttonとshortcut表記を同じ操作に結び、入力欄ではshortcutを無効化して意図しない実行を防ぐ。
- UIがなければ困る点 / 削る候補: 既存は操作がpointer中心で、shortcutの存在・安全な発火条件が分からない。すべての機能にshortcutを足すと記憶負荷と衝突が増えるため対象を3操作に限定する。
- 検証仮説（未計測）: 指の移動を減らし、textareaを編集しながらの誤実行を防げる。

## 初見・state matrix

| 状態 | 見えるもの | 理解 | 次action | 回復 | a11y通知/構造 | 証跡 | 判定 |
|---|---|---|---|---|---|---|---|
| 通常 | 3操作のbuttonと同一表記のshortcut案内 | 操作と発火条件を先に理解できる | buttonまたはshortcut | 常にbutton操作へ戻れる | visible label、`aria-keyshortcuts`、説明の関連付け | mock screenshot、unit test | PASS |
| 保存 | 保存buttonと `Alt+Shift+S` | 未保存の入力を保存する操作と分かる | button / shortcut | 保存後も編集できる | 既存のstatus通知 | unit/E2E | PASS |
| Compile有効 | `Compile (Alt+Shift+Enter)` | 入力済みならCompiled Promptを作ると分かる | button / shortcut | 既存の入力を編集して再実行できる | disabledと説明文、status通知 | unit/E2E | PASS |
| Compile無効 | disabled buttonと有効化条件 | 対象がないため実行されないと分かる | AI BriefまたはBlocksを入力 | 入力後に有効化 | disabled、説明文 | action availability test | PASS |
| コピー有効 | `コピー (Alt+Shift+C)` | Compiled Promptをコピーする操作と分かる | button / shortcut | 既存の手動コピーfallbackを維持 | `aria-keyshortcuts`、説明文、既存status/dialog | unit test / 既存copy導線 | PASS |
| textarea編集 | 入力に集中でき、shortcutは何も実行しない | Enter等で意図しない保存・Compile・コピーが起きない | 入力を続ける | focus移動後にshortcutを使える | `input` / `textarea` / `select` / `contenteditable`を除外 | unit/E2E | PASS |
| 狭幅 / 文字拡大 | toolbarは既存responsive layoutで縦積み | ラベルが隠れず操作できる | 操作buttonへ移動 | 通常幅に戻す必要なし | button labelを保持、既存focus style | narrow/zoom E2E | PASS |

## 品質確認

- accessibility（keyboard、focus、name/label、structure、contrast、status）: buttonを代替導線として残し、visible label、`aria-keyshortcuts`、説明の関連付けを追加。既存focus styleとstatus通知を維持。textarea等の編集targetから発火しないことをunit/E2Eで確認した。
- 視覚階層（主操作、grouping、密度、狭幅）: 保存・CompileはComposer header、コピーはCompiled Prompt内に置き、shortcut案内をheader直後に1行で集約した。760pxと125%相当の既存E2Eで主要導線・横overflowを確認した。
- copy（用語、error、空、disabled、tone、禁止表記）: labelは既存の保存/Compile/コピーの用語を維持。空状態はdisabledと既存説明文、コピー失敗時は既存の手動コピーfallbackを維持した。
- 熟練者効率（手数、保持、近道）: 3つの反復操作だけをshortcut化し、browser/OS予約とCmd/Ctrl併用を上書きしない。
- 満足感・信頼感（待機、成功、失敗、危険操作、外部送信）: 操作対象・発火条件を表示し、入力中は何もしない。保存/Compile/copyの既存statusと確認導線を変えない。
- 反証レビュー: textarea中のshortcut発火、Cmd/Ctrl併用、key repeat、無効Compile/コピー、shortcutだけでbuttonが見つからない状態を検証し、阻害なし。

## 指摘

| 優先度 | 箇所 | 問題 | 影響 | 修正案 | 状態 |
|---|---|---|---|---|---|
| P1 | 既存Composer | 主要反復操作にshortcutと発見性がない | pointer移動と記憶負荷 | 最小3操作、visible shortcut、textarea境界を追加 | 対応済み |

## 証跡・検証

- 変更前/変更後screenshot: 安全なmock環境で撮影済み。PR本文へ添付予定。表示内容にAPI key、個人情報、ユーザーprompt、画像、ローカルpathがないことを目視し、metadataを確認した。
- test / trace / 手動確認: `make client-lint`、`make client-typecheck`、`make client-test`（14 files / 39 tests）、`make e2e`（20 tests）、`make client-build`、`git diff --check`、`bash scripts/verify-ai-governance.sh`がPASS。
- 取得できなかった証跡と理由: 実運用データ・実OpenAI APIは対象外。安全なmock環境だけを確認した。

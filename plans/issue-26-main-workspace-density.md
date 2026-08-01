# Issue #26: 主作業を優先する文字サイズ・pane密度

## 目的

長時間のPrompt編集で主作業の可読性を確保し、補助Inspectorは必要な時だけ表示して主作業を圧迫しない状態にする。

## 非目標

- ブランドカラーの全面変更。
- AI Inspector、パラメータ設定、Prompt Doctorの機能削除。

## 対象範囲

- 主要本文・見出し・補助文の文字サイズと行間。
- 非Composer画面でのInspectorの文脈表示と再表示導線。
- 通常幅、狭幅、文字拡大のvisual evidenceとE2E。

## 受け入れ条件

- 主本文と補助文のサイズ・行間が読解を妨げない。
- 主作業が補助Inspectorより優先して見える。
- 文字拡大と狭幅で主要操作を失わない。

## 検証

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`
- 狭幅・文字拡大のPlaywright visual evidence
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知のリスク

- 非Composer画面でInspectorを既定で隠すため、明示的な表示/非表示buttonを常設し、キーボードで到達できるようにする。

## 実施記録

- 基準文字を16px、行間を1.55へ変更し、見出し・field label・補助文・AI処理履歴の極小文字を読みやすい大きさへ揃えた。
- Composer以外ではInspectorを既定で隠し、tab barの`AIの状況を表示`/`AIの状況を隠す`で明示的に切り替えられるようにした。
- `contextual-inspector`、760px reflow、125%相当文字拡大のE2Eと、通常幅・文字拡大の隔離mock screenshotを取得した。

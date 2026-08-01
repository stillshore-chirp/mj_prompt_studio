# Issue #27: Main navigationの現在地と操作可能性

## 目的

現在地と移動先を視覚・keyboard・支援技術で一貫して理解でき、操作できない装飾をbuttonと誤認しない状態にする。

## 非目標

- 情報アーキテクチャ全体の再編。
- Project作成機能の追加。

## 対象範囲

- Main tabsとQuick Actionsの現在地・選択状態・対応panelのsemantics。
- Project selectionの現在地表現。
- 左pane見出しの疑似plus表現の削除。
- keyboard/a11y回帰test、前後画面証跡。

## 受け入れ条件

- 現在tabと対応panelが支援技術へ伝わる。
- active状態が色以外にも区別できる。
- 操作できない要素を操作可能に見せない。

## 検証

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`
- DOM accessibility snapshot、keyboard E2E、変更前後screenshot
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知のリスク

- tab roleへ変更しても既存の未保存draft確認とtab切替を変えない。

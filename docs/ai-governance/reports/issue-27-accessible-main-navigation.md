# Issue #27 Main navigationの現在地と操作可能性

## 概要

- 対象Issue / 作業: #27 / Main tabs、Project navigation、Quick Actions
- 判定: ローカルPass。PR CI、review、マージ後CIは継続中。

## ユーザー価値

- 対象・文脈・目的: 複数の制作画面を移動する利用者が、現在地と移動先を迷わず理解し、キーボードでも同じ導線を使える。
- 改善: Main tabsを`tablist`/`tab`/`tabpanel`として関連付け、選択状態を`aria-selected`で伝える。矢印、Home、Endでtabを移動できる。ProjectとQuick Actionsには現在地を`aria-current`と「現在」badgeで示し、非操作の疑似plus記号を除去した。

## state matrix

| 状態 | 表示・操作 | a11y・証跡 | 判定 |
|---|---|---|---|
| 初期Composer | Composerが選択済み・workspaceと関連付く | `aria-selected`、`aria-controls`、`aria-labelledby` E2E | Pass |
| tab移動 | 選択tabだけを現在として示す | ArrowRight、Home、End E2E | Pass |
| Quick Action対象 | 対応するQuick Actionに現在badge | `aria-current=page` E2E | Pass |
| Project選択 | 選択Projectに現在badge | `aria-current=page`、native button | Pass |
| 左pane見出し | 操作できないplus風装飾なし | 視覚確認 | Pass |

## 品質確認

- accessibility: tabとpanelを関連付け、選択されていないtabをTab順から外し、矢印/Home/Endで選択とfocusを移動する。既存の未保存draft確認を通る既存navigation経路を再利用する。
- 視覚階層: activeの背景色・枠線に加えて「現在」を表示する。見出しの疑似button表現を除去する。
- 反証レビュー: inactive tabの`aria-controls`が存在しないpanelを参照しないよう、すべてのtabは常設workspace panelを参照し、active tabだけをpanelのlabelにする。

## 証跡・検証

- 変更前screenshot: `/private/tmp/mjps-issue-27-before.jpg`（隔離Mockデータのみ）
- 変更後screenshot: `/private/tmp/mjps-issue-27-after.jpg`（隔離Mockデータのみ）
- test: `make client-lint`、`make client-typecheck`、`make client-test`（34 tests）、`make client-build`、専用Playwright E2E（tab/panel関連付け、ArrowRight、End、Quick Action現在地）。
- 継続予定: 全E2E、PR CI、review thread、マージ後main CI。
- 未実施: 実ユーザー評価。実装と隔離Mock UIの状態遷移のみを確認する。

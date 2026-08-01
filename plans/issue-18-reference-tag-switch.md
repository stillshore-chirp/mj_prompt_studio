# Issue #18: Reference素材切替時のタグ誤保存を防ぐ

## 目的

素材切替で別素材のタグを誤表示・誤保存しない。

## 受け入れ条件

- [x] 素材切替時、選択中素材の保存済みタグだけを表示する。
- [x] 未保存タグを持つ切替で破棄確認を表示する。
- [x] 保存は選択中のreference idへだけ送る。

## 検証

- client lint/typecheck/test/build（24 tests）
- 隔離mock E2EでA→B選択・破棄確認を実施
- `git diff --check`、AI governance verification

## リスク

- 実ユーザー素材・タグ本文をテストやPR証跡に使わない。

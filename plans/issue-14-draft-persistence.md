# Issue #14: 未保存のComposer・parameter編集を保護

- Issue: [#14](https://github.com/stillshore-chirp/mj_prompt_studio/issues/14)
- 分類: UI/UX / アクセシビリティ / 状態・エラー・待機
- 目的: 編集直後の未保存状態を明示し、project切替・新規・Undo/Redo・tab遷移で入力を失わないようにする。
- 非目標: auto-save、永続draft保存、LLM/API契約変更。

## 受け入れ条件

- [x] 編集直後に未保存状態を視覚・支援技術へ伝える。
- [x] 保存成功後だけ保存済み表示になる。
- [x] 破棄し得る移動前に対象と選択肢を確認する。
- [x] キャンセルで入力を保持し、保存後は遷移できる。

## 検証

- `make client-lint && make client-typecheck && make client-test && make client-build`
- `make e2e`（利用中port時は隔離E2EとCIで代替）
- `git diff --check && bash scripts/verify-ai-governance.sh`

## 状態・リスク

- dirty時だけ確認を表示し、保存済み操作を妨げない。
- 保存失敗時は遷移させず、入力を保持する。
- `make e2e` の標準portは既存プロセスを停止せず、隔離portのPlaywright 7件とCIで代替した。

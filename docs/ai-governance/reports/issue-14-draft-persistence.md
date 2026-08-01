# UI/UXレビュー報告: Issue #14 未保存編集の保護

## 対象・価値

- 対象: ComposerとParameter Inspectorを編集し、別project・tab・履歴へ移動する利用者。
- 目的: 保存済みか未保存か、移動時に何が起こるか、どう回復できるかを理解して入力を失わない。

## state matrix

| 状態 | 表示 | 次action / 回復 | a11y | 判定 |
|---|---|---|---|---|
| saved | 保存済み | 通常の移動 | status | 実装後更新 |
| dirty | 未保存の変更 | 保存または移動操作 | status | 実装後更新 |
| dirty + move | 対象と保存して続行 | 保存 / キャンセル | dialog | 実装後更新 |
| save failure | error、入力保持 | 再試行 / キャンセル | live status | 実装後更新 |

## 反証

- tab unmount、project切替、新規、Undo/Redoでdirtyが失われないこと。
- 保存失敗後に遷移せず、未保存入力を保持すること。
- dirtyでない操作にconfirmationを増やさないこと。

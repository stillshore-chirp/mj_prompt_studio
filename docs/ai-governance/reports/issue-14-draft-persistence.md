# UI/UXレビュー報告: Issue #14 未保存編集の保護

## 対象・価値

- 対象: ComposerとParameter Inspectorを編集し、別project・tab・履歴へ移動する利用者。
- 目的: 保存済みか未保存か、移動時に何が起こるか、どう回復できるかを理解して入力を失わない。

## state matrix

| 状態 | 表示 | 次action / 回復 | a11y | 判定 |
|---|---|---|---|---|
| saved | 保存済み | 通常の移動 | `role=status` | Pass |
| dirty | 未保存の変更 | 保存または移動操作 | `role=status`、`aria-live=polite` | Pass |
| dirty + tab / project / new | 対象と保存して続行 | 保存 / キャンセル | `role=dialog` | Pass |
| dirty + Undo / Redo | 破棄対象と履歴操作 | 破棄して続行 / キャンセル | `role=dialog` | Pass |
| save failure | error、入力保持 | 再試行 / キャンセル | live status | Pass（component test） |

## 反証

- tab unmount、project切替、新規、Undo/Redoでdirtyが失われないこと。
- 保存失敗後に遷移せず、未保存入力を保持すること。
- dirtyでない操作にconfirmationを増やさないこと。

## 証跡

- component test: 保存・キャンセル・保存失敗時の入力保持を確認。
- 隔離E2E: Composer下書きのキャンセル回復、保存後tab遷移、Undo前の破棄確認、既存workflowを含む8件が成功。
- [変更前後の画面証跡](https://github.com/stillshore-chirp/mj_prompt_studio/pull/34#issuecomment-5152000610): 安全なmock fixtureのみを入力して取得。

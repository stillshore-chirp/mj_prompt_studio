# Issue #18 UI/UXレビュー記録

| 状態 | 表示 | 回復導線 |
| --- | --- | --- |
| 保存済みタグで素材を切替 | 選択素材のタグを初期表示 | Tags 保存 |
| 未保存タグで素材を切替 | 破棄確認dialog | キャンセルまたは破棄して切替 |
| 保存 | 現在選択中のreference idへ保存 | 保存後は通常切替 |

- dialogは既存のfocus trap・背景inertを再利用する。
- component testと安全fixtureのみの隔離mock E2Eで、素材間のタグ誤保存を検証する。

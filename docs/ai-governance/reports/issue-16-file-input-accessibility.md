# UI/UXレビュー報告: Issue #16 画像追加のキーボード操作

## 対象・価値

- 対象: キーボードまたは支援技術で参照素材・生成結果を追加する利用者。
- 目的: 追加先、受け付け形式、失敗時の回復を画像内容を公開せず理解できるようにする。

## state matrix

| 状態 | 表示 | 次action / 回復 | a11y | 判定 |
|---|---|---|---|---|
| picker開始 | 対象を含むbutton名 | Enterでfile picker | button / description | Pass |
| 画像選択 | 追加先・失敗時の回復 | uploadへ進む | status | Pass |
| 非画像選択 / drop | 形式エラー | 画像を再選択 | status | Pass |
| drag & drop | 補助説明 | keyboard選択へ | region / text | Pass |

## 証跡

- 隔離E2E: Reference LibraryとResult Reviewの選択buttonをTab/Enterで操作し、file chooser起動を確認。
- 既存workflowを含む隔離Playwright 10件が成功。
- 画像本体はUI証跡・Issue・PRへ含めない。

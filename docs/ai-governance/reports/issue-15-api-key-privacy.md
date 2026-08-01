# UI/UXレビュー報告: Issue #15 API keyとPrivacy設定

## 対象・価値

- 対象: 初めてAPI keyを設定する利用者、および実APIの保存・送信範囲を判断する利用者。
- 目的: key値を露出せず、保存先とPrivacy modeの将来のAPI送信影響を理解して選択できるようにする。

## state matrix

| 状態 | 表示 | 次action / 回復 | a11y | 判定 |
|---|---|---|---|---|
| key空 | 適用操作を無効化 | keyを入力 | label / description | Pass |
| session適用成功 | 入力消去と保存範囲 | 続行 | status | Pass |
| Keyring利用不可 | sessionのみ適用 | OS設定確認 / 続行 | status | Pass |
| mock mode | 外部接続なし | 実API key設定へ | disabled理由 | Pass |
| Privacy変更前 | 送信・継続・保存影響 | 確認 / キャンセル | dialog | Pass |
| Privacy保存失敗 | 変更なし | 再試行 | status | Pass（component test） |

## 反証

- API keyの値がDOM、ログ、スクリーンショット、PRへ残らないこと。
- Privacy modeは確認前にローカル設定を変更しないこと。
- mock modeで実API接続テストを可能に見せないこと。

## 証跡

- component test: 空入力の抑止、session適用後の入力消去、Privacy変更の確認・キャンセルを確認。
- 隔離E2E: mock modeでの接続テスト無効化、Privacy確認・キャンセル、既存workflowを含む9件が成功。
- 画面証跡はmock modeかつAPI key未入力で取得する。

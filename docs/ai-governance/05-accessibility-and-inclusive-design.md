# アクセシビリティとインクルーシブデザイン

アクセシビリティはUI/UX変更の完了条件です。

## キーボードとfocus

- 主要taskをkeyboardだけで完了できる。
- focus順序が視覚・操作順序と一致し、常に見え、閉じ込められない。
- dialog、tab、menu、drag and dropの代替操作がある。
- Esc、Enter、Space、Tab、Shift+Tabが期待どおりに動く。

## 名前・役割・値・構造

- button、link、input、tab、dialogに適切なaccessible nameとroleがある。
- icon-onlyには意味のあるlabelがあり、表示labelと支援技術上の名前が矛盾しない。
- selected、expanded、disabled、busy、errorなどの状態が伝わる。
- 見出し、navigation、main、complementary、list、tableを見た目だけで作らない。

## 視認性と操作対象

- text、placeholder、border、icon、focus indicatorに十分なcontrastがある。
- 色だけでerror、success、warning、selected、requiredを伝えない。
- 操作対象と間隔が十分で、危険操作を小さなiconだけにしない。
- 文字拡大、zoom、狭幅、reflowで主操作が失われない。

## errorと状態通知

error箇所、原因、修正方法を示し、入力を保持します。保存、LLM処理、upload、copy、失敗、再試行など必要なstatusを支援技術へ通知し、短すぎる通知だけに依存しません。

## 最低目安

既存design systemを優先し、なければ本文16px以上、長文行高1.5以上、通常text 4.5:1以上、大きい文字・非text部品3:1以上、操作対象24×24 CSS px以上を目安にします。自動検査と手動keyboard確認の両方を報告します。

# Issue #15: API keyとPrivacy設定の保護

- Issue: [#15](https://github.com/stillshore-chirp/mj_prompt_studio/issues/15)
- 分類: UI/UX / アクセシビリティ / セキュリティ / 状態・エラー・待機
- 目的: API keyとPrivacy設定の保存先、送信影響、失敗時の回復を正確に理解して操作できるようにする。
- 非目標: API keyの保存方式の変更、実APIを使う自動接続test。

## 受け入れ条件

- [x] API key欄と各操作の対象・保存範囲が読み上げと表示で分かる。
- [x] 空値を適用できず、適用後に平文入力を残さない。
- [x] Privacy変更前に影響を理解でき、結果と失敗時の回復を示す。
- [x] mock/実API設定を混同しない。

## 検証

- `make client-lint && make client-typecheck && make client-test && make client-build`
- 隔離E2E、`git diff --check`、`bash scripts/verify-ai-governance.sh`

## 状態・リスク

- API keyの値、実API呼び出し、個人データをtest・ログ・スクリーンショット・Issue・PRへ残さない。
- 標準E2E portは既存プロセスを停止せず、隔離portのPlaywright 9件とCIで代替する。

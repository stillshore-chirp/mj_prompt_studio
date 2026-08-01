# Issue #25: 空・検索結果なし・部分状態の次行動

## 目的

初めての利用者がReference Library、Result Review、Matrix Labの目的・必要な準備・最初の安全な行動を理解できるようにする。

## 非目標

- 全体onboardingやチュートリアルを追加しない。
- 既存の素材・画像・Matrix planを変更しない。

## 対象範囲

- 各画面の初回空、検索結果なし、部分状態の原因・次行動・回復。
- 空状態から主要操作へ進むkeyboard導線と状態通知。
- component/E2E state matrix、UI/UX証跡。

## 受け入れ条件

- 初回空、検索結果なし、失敗を区別する。
- 各状態で原因、次行動、回復を示す。
- 空状態から主要taskへkeyboardで進める。

## 検証

- `make client-lint`
- `make client-typecheck`
- `make client-test`
- `make client-build`
- `make e2e`
- `git diff --check`
- `bash scripts/verify-ai-governance.sh`

## 既知のリスク

- 空状態の説明が一覧領域を圧迫しないよう、素材やvariantがある通常状態では表示しない。

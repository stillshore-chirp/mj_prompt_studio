# make run の Python コマンド修正

## 目的

- Apple Silicon 環境で `PYTHON="arch -arm64 .venv/bin/python"` が設定された場合でも、`make run` から API と React client を起動できるようにする。

## 非目標

- Python 仮想環境の作成方法や依存関係を変更しない。
- API / React client の起動ポートや終了処理を変更しない。

## 対象範囲

- `scripts/run_local_app.py` の子 Python プロセス起動引数。
- 同じ不具合を固定する回帰テスト。
- 必要な場合のみ起動方法の文書。

## マイルストーン

- [x] 修正前の失敗条件を回帰テストで再現する。
- [x] ランチャーを実行中の Python interpreter を API 起動にも利用する。
- [x] lint / typecheck / test / build とローカル起動確認を完了する。
- [x] Ready PR を作成し、push / pull_request の checks を監視する。

## 受け入れ条件

- [x] `make run` が複数語の Python コマンドを環境変数 `PYTHON` に格納しない。
- [x] 子 API はランチャーを実行中の `sys.executable` を利用する。
- [x] `make run` で報告された `FileNotFoundError` が発生しない。
- [x] 関連する品質ゲートが成功する。

## 検証コマンド

- `make lint`
- `make typecheck`
- `make test`
- `make build`
- `make run`（API / client の起動を確認後に終了）

## 既知 blocker

- なし。

## Rollback

- `Makefile` と `scripts/run_local_app.py` の interpreter 継承変更、および回帰テストを同時に revert する。

## PR 方針

- 受け入れ条件を満たしてから Ready PR を作成する。

## 検証結果

- 修正前: `tests/test_run_local_app.py` で `PYTHON="arch -arm64 .venv/bin/python"` が単一の実行ファイル名として渡される失敗を再現。
- `make lint`: 成功。
- `make typecheck`: 成功（49 source files）。
- `make test`: 成功（44 passed）。
- `make build`: 成功。
- `make run PYTHON='arch -arm64 .venv/bin/python' MJPS_DATA_DIR='/private/tmp/mjps-make-run-smoke'`: API と Vite の起動成功を確認後、Ctrl+C で停止。
- README / docs: 公開される起動手順と仕様は変わらないため更新不要と判断。
- Ready PR: https://github.com/stillshore-chirp/mj_prompt_studio/pull/8
- 初回 push CI: 成功（https://github.com/stillshore-chirp/mj_prompt_studio/actions/runs/30685876846）。
- 初回 pull_request CI: 成功（https://github.com/stillshore-chirp/mj_prompt_studio/actions/runs/30685895495）。
- 非blocking annotation: GitHub Actions が Node.js 20 廃止予定を通知しているが、runner は Node.js 24 を強制利用しており全 job は成功。

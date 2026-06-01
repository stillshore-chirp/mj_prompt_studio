# AGENTS.md 分割計画

## 目的

- ルート `AGENTS.md` を Codex の既定読み込み上限である 32KiB 未満に収める。
- 作業開始時に必ず読むべき運用ルールを `AGENTS.md` 冒頭へ集約する。
- 詳細な汎用ルールと本リポジトリ固有ルールを `docs/process/` 配下へ分割し、情報を失わない。

## 非目標

- 既存ルールの意味を大きく変更しない。
- CI やアプリ実装の挙動は変更しない。

## 対象範囲

- `AGENTS.md`
- `docs/process/agent-general-rules.md`
- `docs/process/mj-prompt-studio-rules.md`
- 必要に応じた運用文書と検証記録

## マイルストーン

- [x] 現在の `AGENTS.md` のサイズと構成を確認する。
- [x] 詳細ルールを `docs/process/` 配下へ分割する。
- [x] ルート `AGENTS.md` を 32KiB 未満の入口文書へ書き換える。
- [x] サイズ、リンク、差分を確認する。
- [x] ローカル検証を完了し、コミット可能な状態にする。

## 受け入れ条件

- [x] `AGENTS.md` が 32,768 bytes 未満である。
- [x] 分割先の詳細ルール文書が存在し、元の主要ルールが参照可能である。
- [x] `AGENTS.md` 冒頭に、ブランチ、進捗管理、コミット、PR、CI 監視の必須運用が明記されている。
- [x] Markdown と差分に明らかな破損がない。
- [x] PR 作成と CI 監視に進める状態である。

## 検証コマンド

- `wc -c AGENTS.md docs/process/agent-general-rules.md docs/process/mj-prompt-studio-rules.md`
- `python -m pytest`
- `git diff --check`

## 既知 blocker

- なし

## feature flag / rollback

- 文書分割のみのため、通常の git revert で戻せる。

## 検証記録

| 日時 | コマンド | 結果 | メモ |
|---|---|---|---|
| 2026-06-02 | `wc -c AGENTS.md` | 8,721 bytes | 32KiB 未満 |
| 2026-06-02 | `wc -c docs/process/agent-general-rules.md docs/process/mj-prompt-studio-rules.md` | 22,822 / 20,542 bytes | 分割先も 32KiB 未満 |
| 2026-06-02 | `git diff --check` | 成功 | 空白エラーなし |
| 2026-06-02 | `.venv/bin/python -m pytest` | 成功 | 31 passed |
| 2026-06-02 | GitHub Actions `Quality and package` | 失敗 | `docs/` へ移動した禁止バージョン表記の例示が public text policy に検出された |
| 2026-06-02 | `.venv/bin/python scripts/verify_ui_text.py` | 成功 | 禁止例の具体文字列を汎用説明へ修正 |
| 2026-06-02 | `.venv/bin/python -m pytest` | 成功 | 31 passed |
| 2026-06-02 | `git diff --check` | 成功 | 空白エラーなし |

# 長期task実行手順

この文書は、複数工程のtaskを安全に完遂するための補助です。共通hard gateは `AGENTS.md`、GitHub配送の具体的手順は `.agents/skills/github-delivery/SKILL.md` を優先します。

## 開始時

1. `AGENTS.md` と変更対象に最も近い `AGENTS.md`、発動するSkillを読む。
2. default branch、作業branch、未commit差分、直近履歴を確認する。
3. 既存Issueを検索し、必要ならIssue品質ゲートを満たすIssueを作成する。
4. `plans/TEMPLATE.md` をもとに `plans/<task-id>.md` を作成または更新する。
5. 目的、非目標、対象範囲、受け入れ条件、検証、blocker、rollback方針を明示する。
6. 既存のMakefile、scripts、README、CIから検証入口を確認する。

## 進行中

- 不明点は致命的でなければ仮定としてplanへ残し、実装を進める。
- milestoneごとに必要なlint、typecheck、test、buildを実行する。
- 失敗を認識したまま次へ進まず、修正またはBlockedとして整理する。
- UI、Application、Domain、Infrastructure、LLMの責務を混在させない。
- 無関係な既存差分を巻き込まない。
- 副作用のある再実行ではidempotency、checkpoint、deduplicationを検討する。

## 停止条件

- 外部依存、権限不足、環境障害、要件衝突、破壊的変更判断、秘密情報不足で実質的に進行不能な場合に停止する。
- 停止時はplanの項目をDone、Blocked、Cancelledへ整理し、再開条件と次の最短actionを記録する。
- Blockedでも安全に完了できるtest、文書、static validationが残る場合は先に実施する。

## 完了時

1. 受け入れ条件をDoneまたは理由付きBlockedへ整理する。
2. 検証commandと結果をplanへ記録する。
3. READMEとdocsが実装に追従していることを確認する。
4. 不要file、API key、DB、cache、log、画像assetがgit追跡されていないことを確認する。
5. 公開まで依頼されている場合は、GitHub配送Skillに従い、commit、push、Ready PR、latest headのCI、利用可能なreview、未解決threadを確認する。
6. Issue、branch、PR、commit、local verification、CI、review、remaining risksを最終報告できる状態にする。

特定GitHub client、特定review bot、固定回数のclean reviewを共通の完了条件にしません。利用可能な同等手段とlatest meaningful changeの証跡で判断します。

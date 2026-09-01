---
name: github-delivery
description: "Issue、branch、commit、push、PR、CI、review、release準備を安全に一気通貫で行う時に使う。利用可能なGitHub clientを使い、latest headの検証とreviewを確認し、merge/closeは明示指示がある場合だけ行う。"
---

# GitHub配送 Skill

## 発動条件

リポジトリ変更をIssue、commit、push、PR、CI、reviewまで運ぶ作業で使います。read-only調査や回答だけでは発動しません。

## Issue-first

1. ルートと対象pathの `AGENTS.md`、関連Skill、現行のIssue・PR・CI状態を読む。
2. 既存Issueの受入条件、履歴、重複を確認し、なければIssueを先に作る。[Issue quality gate](../../../docs/ai-governance/14-issue-quality-gate.md)に従い、Issueには目的、根拠、scope、非対象、受入条件、verification、riskを短く置く。
3. 最新のdefault branchから作業branchを作り、対象pathとwrite ownershipを固定する。現在のHEAD、base、branch、変更しないpathを記録する。
4. Issueの受入条件を実装・検証・公開へ結び付け、未確認事項を完了扱いにしない。

## Checkpointとinput closure

チェックポイントは `implementation → focused_verification → code_freeze → measurement → publication_freeze → external_gate → review_fix → accepted` の順で進める。各checkpointで、少なくとも `gate / HEAD・base / input paths / 関連設定・生成物 / 実行条件 / result / artifact reference` を記録する。

gateのinput closureは、変更pathだけでなく、関連する設定、schema、生成物、fixture、依存関係、実行条件を含む。受入条件に必要な最小gateを既存の変更種別mapから選び、full suite、coverage、外部CI、包括reviewなど高コストgateはcode・測定scope・公開境界をfreezeしてから開始する。closure内のHEAD/base、path、設定、生成物、条件が変わったgateだけを、失効理由と再取得対象を明示して再実行する。同一HEAD・同一closure・同一条件の証跡は再利用し、同じ長時間検証やclean reviewを根拠なく重ねない。base変更はbase依存のexternal gateだけを失効させる。

開発中は変更pathに対応するfocused verificationを使い、最終HEADではclosureへ束縛した必要gateを一度実行する。回数だけを固定する追加ルールは設けず、判定不能時はskipせずfallback理由と範囲を記録する。

## 委任・証跡・待機

subagentへ渡す最小文脈は、目的、acceptance、risk、HEAD/base、target paths、write ownership、phase、依存するgate、停止条件、cleanup、output capだけにする。完了時のevidence packageは `scope/acceptance / changed paths / conclusion / verification / unperformed checks / remaining risks / snapshot・diff / artifact reference` を含める。進展しないlaneはscopeを縮小して再割当し、primary回収が必要なら `specific_reason / evidence_subagent_cannot_continue / scope_shrink_history / reassignment_history / primary_only_question / target_paths / output_cap` を残す。

waitはイベント駆動を優先し、状態変化がない間は同じ照会を繰り返さない。timeoutはfailureではなく、実行中のownerを維持してbackoff後に再waitする。長いraw outputは一時artifactへ置き、返すのはexit code、pass/fail/skip、coverage総計、warning、失敗箇所、参照先に限る。

## Commit・PR・review

- commitは独立してreview・revertできる一つの論理責務または受入条件の単位にする。対応するtest、docs、schema、client、生成物は同じcommitに含める。
- `git add` は対象pathを明示し、staged file、staged diff、`git diff --check`、秘密情報・実データ・無関係差分の不在を確認する。`git add .` と `git add -A` は使わない。
- PRはIssue、scope、非対象、verification、input closure、残るriskを短く示す。latest HEADに対してCI、review、unresolved thread、mergeabilityを確認し、古いHEADの証跡を現在の根拠にしない。
- review修正は責務単位でcommit・pushし、latest HEADの関連gateが成功した後にだけ返信・解決する。コード変更が不要なthreadも根拠と公開安全性を確認する。
- PR監視では各runの冒頭に軽量状態キー（`state`、`headRefOid`、`updatedAt`、`reviewDecision`、`mergeStateStatus`）を取得し、`state`を最優先で判定する。`MERGED` または `CLOSED` ならpolling・詳細取得・再依頼を止め、監視resourceをcleanupする。`OPEN` ではhead、更新時刻、review、CIの変化を境界と期限付きで待ち、イベントがない間はbackoffする。
- `OPEN` の無変化待ちは固定timeout回数を完了条件にせず、logical checkpointまたはdeadlineで継続要否を再評価する。継続不要なら監視を停止し、停止理由と未確認範囲を記録する。timeoutだけでは証跡を失効させない。

## 権限境界と終了

commit、push、PR、Issue更新は依頼された配送範囲で行う。merge、Issue/PRのclose、release、deploy、外部への実データ送信、force-push、破壊的操作は対象と明示指示がある場合だけ行う。通常テストから実OpenAI API、画像生成サービス、Cookie、Token、非公式APIを操作しない。

終了報告には、Issue、branch、commit、PR、latest HEAD、local verification、CI、review、mergeability、未実行確認、残るriskとblockerを含め、unverifiedを明記する。

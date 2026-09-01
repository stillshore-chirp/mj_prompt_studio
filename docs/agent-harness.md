# エージェントハーネス設計・保守ガイド

この文書は、Codex、Claude Code、Cursorで共有する、正本の読者・配置、委任、evidence、task-state、runtimeの最小契約です。説明文であり、機械検査や製品runtimeの代替ではありません。

## 正本、読者、責務

| 正本 | 主な読者 | 責務 |
|---|---|---|
| AGENTS.md、最寄りのAGENTS.md | 3製品 | hard gate、権限、path契約、最小実行 |
| CLAUDE.md、.claude/、.cursor/ | Claude Code / Cursor | 共通正本へ接続する薄いadapter |
| .agents/skills/<name>/SKILL.md | 3製品 | task固有の発動条件、手順、handoff |
| docs/ai-governance/ | agent、reviewer | UI/UX、Issue、evidence、完了判定 |
| この文書 | agent、reviewer、保守者 | 配置、委任、証跡、task-state、runtime境界 |
| scripts/validate_governance.py と focused tests | CI、保守者 | 正本、参照、入力分類、task-state、budgetのstatic検査 |

Codexはrootと最寄りのAGENTS.md、該当Skillを読みます。Claude CodeはCLAUDE.mdとpath ruleから同じ正本へ接続し、CursorはrootとMDC routerから接続します。adapterは本文を複製せず、共通hard gateを弱めません。

## 読み分けと変更影響

全体の安全境界と権限はroot、path契約は最寄りのAGENTS.md、task手順はSkillに置きます。設計heuristicは [docs/agent-principles.md](agent-principles.md)、rule変更基準は [docs/ai-governance/13-maintenance-policy.md](ai-governance/13-maintenance-policy.md) が正本です。logic、API、schema、data契約、複数layerを変える場合は参照追跡と実code・契約・関連testで影響を確認します。

## 配送checkpoint

改修は必要なcheckpointを次の順で通過します。各段階でHEAD / base、入力閉包、owner、終了条件を固定します。

1. implementation: scope、acceptance、非対象、owner、変更pathを確定。
2. focused_verification: 変更pathに対応する最小十分なtest・構造確認。
3. code_freeze: source、test、設定、生成物とgateの入力閉包を固定。
4. measurement: 受入条件または計測taskで必要な場合だけ、固定snapshot・scopeで必要な実測を記録。
5. publication_freeze: Issue、PR、report、artifactの公開内容と安全性を固定。
6. external_gate: 必要なCI、review、thread、mergeabilityを確認。
7. review_fix: actionableな修正後、交差するgateだけを再取得。
8. accepted: latest HEAD / base、CI、review、thread、受入条件を同一snapshotで照合。

measurementは全taskの必須checkpointではありません。受入条件または明示された計測taskに必要な場合だけ選択し、不要な計測やtoken telemetryを要求しません。

## evidence、snapshot、task-state

stable evidenceはHEAD / base、変更path、関連設定、生成物、実行条件、結果、artifact参照へ束縛します。CI、review / thread、mergeability、待機中statusはvolatile delivery stateとして分けます。base、path、設定、生成物、条件が入力閉包と交差したgateだけを失効・再取得し、latest meaningful changeへ結び付けます。

task-stateはcross-sessionの現在状態、completed evidence packageは一回のlane結果の要約です。packageにはstatus、scope / revision、verification、unperformed checks、remaining risks、stop reason、snapshot/diff、artifact referenceを含め、raw logやfile全文を通常報告へ含めません。timeoutはfailureやevidence失効ではなく、laneをrunningのままbackoffして再待機します。

## 委任契約

委任時にrisk lane、owner、target HEAD / base、target paths、acceptance、depends_on、snapshot phase、write ownership、runtime resources、ports、cleanup、output cap、verification、reuse_evidence、invalidation conditionを固定します。同一risk laneのcompleted packageは短く一回だけ返し、partial / unverifiedは未確認範囲と再開条件を保持します。checkpointを逃した時は同じownerへ一度確認し、進展がなければscope shrink、次にreassignします。

## runtimeとadvisoryの境界

runtimeまたはdev serverを使うlaneは、起動前にowner、PID、process group、port、readiness、cleanupを決め、終了時にprocess groupとport解放を確認します。不明なruntime証跡は完了根拠にしません。runtimeを使わない場合はその旨を記録します。

static validator、Hook、adapter、rule発見、sandbox、権限、runtime routingの観測範囲を混同しません。configured、observed、unverifiedを分け、static PASSをruntime成功と表現しません。

## Instruction budgetと完了

root、nested、adapter、canonical Skillの常時読込量はvalidatorのbudgetで確認します。estimateをobserved token usageと混同しません。正本へ到達でき、adapterが本文を複製せず、必要なgateと公開安全性を満たし、未確認範囲を報告できる時だけ完了候補とします。Hard gateとheuristic、未解決のP0 / P1、security、data integrity、受入証跡の矛盾は明示して止めます。

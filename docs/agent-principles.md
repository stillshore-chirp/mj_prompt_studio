# Agent Principles

この文書は、MJ Prompt Studioの設計・実装判断に使う heuristic だけを定めます。hard gateと権限境界は [AGENTS.md](../AGENTS.md)、委任・証跡・task-stateは [docs/agent-harness.md](agent-harness.md)、作業手順は該当Skillを優先します。

複数の原則が競合する場合は、要件、既存構造、変更容易性、誤用リスク、検証可能性を比較します。数値目安だけでFailにせず、安全に変更・利用できるかで判断します。

## KISS、YAGNI、DRY

- 要件を満たす最小の構造から始め、使われない拡張点や設定を先行追加しません。
- ネスト、間接参照、動的import、汎用interfaceは、明確な利点がある場合に使います。
- 重複回数だけで抽象化を強制しない。変更理由、lifecycle、契約が共有される時だけ共通化します。
- 定数、schema、validation、test dataは不整合を防げる単位へ集約します。

## SRP、SoC、依存方向

- file、class、function、componentの責務を名前とpublic APIから説明できる状態にします。
- React client、Application、Domain、Infrastructure、LLMを区別し、外部技術の詳細をdomain判断へ漏らしません。
- localhost API routeはtransport契約、Application Serviceはuse case、domainは技術非依存の判断を持ちます。
- logging、metrics、retry、authorizationは一貫して適用できる境界へ置きます。

## POLAと外部統合

- 同種のAPI、非同期処理、error、validation messageは一貫した契約にします。
- 副作用や破壊的操作は名前、引数、戻り値から予測できるようにします。
- 外部API、storage、LLM providerの抽象化は、差し替え、契約test、障害分離に実益がある境界へ置きます。
- 差し替え需要がないinterfaceや設定を目的化しません。

## エラー、可観測性、test

- 想定可能な失敗はretry、fallback、停止、user通知の方針を明示し、fallbackで設定不備やdata不整合を隠しません。
- logは構造化し、必要最小限のcontextだけを持たせます。
- Unitは判断logic、Integration / contractはAPI・storage・LLM境界、E2Eはcritical導線に使います。
- UI testはrole、label、visible text、状態変化を優先し、偶然のDOM構造へ結合しません。
- flaky testは再実行で隠さず、待機条件、競合、非同期、環境差を直します。

## 依存と文書

- 依存は最小限に保ち、設定の環境差とsecret managementを分離します。
- API、LLM、保存、Privacy、配布の意味が変わる時は対応するdocs、schema、testを同じ変更内で更新します。
- coverage値は未検査領域を探す信号として使い、数字だけを目的化しません。

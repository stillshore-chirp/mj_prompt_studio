# CI

CIは変更pathから必要な検証だけを選びます。通常の対象は、main向けPull Requestとmainへのpushです。PRではbase...head、main pushではfull profileを verification_scope が分類し、unknown pathや分類失敗はfail closedにします。

## verification_scope

verification_scopeは変更path、base / head、関連設定、生成物、実行条件から入力閉包を計算します。次の出力を selected jobs と Quality gateへ渡します。

- backend
- frontend
- e2e
- package
- public_text
- governance
- workflow_contract
- classification_ok、selected_checks、changed_path_count、unknown_path_count

selected_checksは分類、workflow YAML、focused contractなど、product gateとは別の最小検証を表します。classification_okがtrueでない場合、selected jobの結果を完了証跡に使いません。

## selected jobs

各jobは verification_scope が true を返した場合だけ実行します。

| job | 主な対象 |
|---|---|
| backend | src、Python test、backend build |
| frontend | React clientのlint、typecheck、test、build |
| e2e | client/e2e、local APIを含むcritical flow |
| package | package、OpenAPI生成、配布入力 |
| public_text | UI・README・docsの公開文字列 |
| governance | central validatorと変更pathに対応するfocused governance tests |
| workflow_contract | workflow YAML、classifier、workflow contract tests |

governance-onlyの変更では、backend、frontend、e2e、packageなど製品gateを選択しません。docsが公開文字列の入力閉包に含まれる場合は public_text が別途選択されます。workflow変更は必要なproduct gateとworkflow_contractを選択し、分類結果をQuality gateで照合します。

AGENTS.mdのbridgeは文書が参照すべき製品契約も示します。文書だけの変更は、その参照だけを理由にproduct gateへ拡大せず、文書・公開文字列・governanceの該当gateで検証します。

## Quality gate

quality_gate は常に起動し、次を確認します。

- verification_scope が成功し、classification_okがtrueである。
- selected jobはsuccess、未選択jobはskippedである。
- classifierが選択したjobと変更pathの入力閉包が一致する。
- main pushでは platform_smoke がsuccess、PRではskippedである。

selected jobの失敗、分類不能、入力閉包の不一致を、未選択やskipとして隠しません。CIの成功は対象commitと入力閉包に対する自動gateの結果であり、実API、配布済みartifact、production状態を保証しません。

## platform_smoke

platform_smokeはmainへのpushでだけ実行し、macOSとWindowsでPython test、Python compile、React client buildを確認します。PRとfeature branchでは起動しません。runtimeを使う追加確認は、owner、PID、process group、port、readiness、cleanupを記録して別のevidenceへ束縛します。

## 共通条件

CIのLLM実行は MJPS_LLM_MODE=mock 固定で、OpenAI API keyや外部API通信を必要としません。実API確認、production調査、公開安全性は別の明示されたscopeと証跡で扱います。jobの再実行やgateの再取得は、入力閉包または受入条件が変わった場合だけ行います。

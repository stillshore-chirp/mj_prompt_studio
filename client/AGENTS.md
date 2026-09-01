# Client AGENTS.md

ルート [AGENTS.md](../AGENTS.md) を先に適用し、この文書は React client 固有の契約だけを追加します。

## Hard gate

- 画面、操作、状態、文言、accessibility、ユーザーに見えるAPI結果を変える場合は、実装前に [UI/UXレビューSkill](../.agents/skills/ui-ux-review/SKILL.md) を読みます。
- loading、empty、no-results、partial、error、validation-error、disabled、API未設定、offline、cancelledを、該当範囲で区別します。
- 主要操作はキーボード、可視focus、accessible name、意味のあるrole / labelで利用できるようにします。
- API key、prompt全文、参照画像、生成画像、local path、実response IDをDOM、console、screenshot、test artifactへ露出させません。
- UIの主要操作、flow、文言が変わる場合は docs/user-manual.md と docs/ui-spec.md の更新要否を確認します。

## 検証

変更範囲に応じて次の最小十分な組合せを選び、未実行項目は理由と残るriskを報告します。

    make client-lint
    make client-typecheck
    make client-test
    make client-build
    make e2e

critical flowを変えた場合は既存Playwright smokeまたは同等のE2Eを更新します。screenshot、trace、visual diffは確認結果と公開安全性を記録します。

## Heuristic

data取得、状態、描画、業務判断の境界を追える構造にします。共通化、新規依存、global state、例外的DOM操作は、既存手段で解決できない根拠がある場合に限ります。

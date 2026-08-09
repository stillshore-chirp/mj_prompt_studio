# Client AGENTS.md

ルート [`AGENTS.md`](../AGENTS.md) を先に適用し、この文書は `client/` 固有の契約だけを追加します。

## Hard gate

- 画面、操作、表示状態、文言、アクセシビリティ、ユーザーに見えるAPI結果を変える場合は、実装前に [UI/UXレビューSkill](../.agents/skills/ui-ux-review/SKILL.md) を読む。
- loading、empty、no-results、partial、error、validation-error、disabled、API未設定、offline、cancelledを、該当する範囲で区別する。
- 主要操作はキーボード、可視フォーカス、accessible name、意味のあるrole / labelで利用できるようにする。
- API key、prompt全文、参照画像、生成画像、local path、実response IDをDOM、console、screenshot、test artifactへ露出させない。
- UIの主要操作、フロー、文言が変わる場合は `docs/user-manual.md` と `docs/ui-spec.md` の更新要否を確認する。
- 実装詳細だけを検査するtestへ寄せず、利用者から観測できるrole、label、text、状態遷移を優先する。

## 検証

変更範囲に応じて最小十分な組合せを実行します。

```bash
make client-lint
make client-typecheck
make client-test
make client-build
make e2e
```

- クリティカル導線を変えた場合は既存Playwright smokeまたは同等のE2Eを更新する。
- screenshot、trace、visual diffを取得した場合は、確認結果と公開安全性をPRへ記録する。
- 未実行項目は理由と残るリスクを報告する。

## Heuristic

- data取得、状態、描画、業務判断の境界を読み手が追える構造にする。
- 共通化は変更理由が共有される単位で行い、見た目が似ているだけの抽象化を避ける。
- 新しい依存、global state、例外的なDOM操作は、既存手段で解決できない根拠がある場合に追加する。

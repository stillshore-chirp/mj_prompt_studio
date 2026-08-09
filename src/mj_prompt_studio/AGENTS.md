# Python Backend AGENTS.md

ルート [`AGENTS.md`](../../AGENTS.md) を先に適用し、この文書は `src/mj_prompt_studio/` 固有の契約だけを追加します。

## Hard gate

- APIのrequest、response、HTTP status、永続化、LLM schemaを変える場合は、関連文書とcontract testを同じ変更内で確認する。
- 例外を黙殺せず、原因、影響、再試行可否をApplication Serviceまたはclientが判断できる形にする。
- ログへAPI key、token、認証header、PII、prompt全文、画像内容、local path、実response / request / job IDを出さない。
- 実OpenAI API、配布artifact、インストール済みアプリ、実ローカルデータについて述べる場合は、[実環境調査Skill](../../.agents/skills/production-investigation/SKILL.md) の証跡条件に従う。
- LLM出力はschemaと意味検証を通し、既存データへ直接適用しない。
- Privacy modeでは保存無効化と継続ID非送信の契約を維持する。
- 不具合修正では、外から観測できる失敗条件を固定する回帰testを原則として追加する。

## 責務境界

- `server/` とAPI routeはtransportと公開契約を扱い、業務判断を抱え込まない。
- `application/` はuse case、transaction、DTO、orchestrationを扱う。
- `domain/` はPromptDocument、Ruleset、Validationなどの技術非依存な判断を扱う。
- `infra/` はSQLite、file storage、settings、keyring、OpenAI adapter、loggingを扱う。
- `llm/` はAgent、prompt、schema、tool adapterを扱い、UIや永続化を直接操作しない。

## 検証

```bash
make lint
make typecheck
make test
make build
```

- DB、外部API、非同期job、設定境界を変えた場合は必要なIntegration / contract testを追加する。
- clientへ見える状態や回復方法が変わる場合は `client/AGENTS.md` とUI/UX Skillも適用する。
- 未実行項目は理由と残るリスクを報告する。

## Heuristic

- Presentation、Application、Domain、Infrastructure、LLMの依存方向を保ち、外部技術の詳細をドメイン判断へ漏らさない。
- 抽象化は差し替え、契約固定、test容易性に実益がある境界へ置く。
- fallbackは利用者影響を減らす場合に限定し、設定不備、データ不整合、実行backendの誤認を隠さない。

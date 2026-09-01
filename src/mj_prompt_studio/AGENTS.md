# Python Backend AGENTS.md

ルート [AGENTS.md](../../AGENTS.md) を先に適用し、この文書は src/mj_prompt_studio/ 固有の契約だけを追加します。

## Hard gate

- APIのrequest、response、HTTP status、永続化、LLM schemaを変える場合は、関連文書とcontract testを同じ変更内で確認します。
- 例外を黙殺せず、原因、影響、再試行可否をApplication Serviceまたはclientが判断できる形にします。
- ログへAPI key、token、認証header、PII、prompt全文、画像内容、local path、実request / response / job IDを出しません。
- 実OpenAI API、配布artifact、インストール済みアプリ、実ローカルデータについて述べる場合は、[実環境調査Skill](../../.agents/skills/production-investigation/SKILL.md) の証跡条件に従います。
- LLM出力はschemaと意味検証を通し、既存データへ直接適用しません。Privacy modeの保存無効化と継続ID非送信を維持します。
- 不具合修正では、外から観測できる失敗条件を固定する回帰testを原則として追加します。

## 責務境界

- server/ とAPI routeはtransportと公開契約、application/はuse case・transaction・DTO・orchestrationを扱います。
- domain/はPromptDocument、Ruleset、Validationなどの技術非依存な判断を扱います。
- infra/はSQLite、file storage、settings、keyring、OpenAI adapter、loggingを扱います。
- llm/はAgent、prompt、schema、tool adapterを扱い、UIや永続化を直接操作しません。

## 検証

    make lint
    make typecheck
    make test
    make build

DB、外部API、非同期job、設定境界を変えた場合は必要なIntegration / contract testを追加します。clientに見える状態や回復方法が変わる場合は client/AGENTS.md とUI/UX Skillも適用します。

## Heuristic

Presentation、Application、Domain、Infrastructure、LLMの依存方向を保ちます。抽象化は差し替え、契約固定、test容易性に実益がある境界へ置き、fallbackで設定不備やdata不整合を隠しません。

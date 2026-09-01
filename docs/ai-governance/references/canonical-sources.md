# Canonical Sources

MJ Prompt StudioのAI agent harnessとUI/UX governanceは、WordPack原本、各製品の公式仕様、本repositoryの製品契約を参照します。

## WordPack原本

- Repository: stillshore-chirp/wordpack-for-english
- 現行同期基準commit: c40782e15a8799ea74e68414d97ddd4f6a9166fa
- 同期対象: main
- 同期日: 2026-09-01
- 主な原本: AGENTS.md、docs/agent-harness.md、docs/agent-principles.md、.agents/skills/、docs/ai-governance/

3製品の正本とthin adapter、bounded delegation、stable evidence / volatile delivery state、task-state、runtimeとstatic検査の境界、checkpointとlatest meaningful changeの扱いをこの現行mainへ合わせています。

## MJ Prompt Studio向け適合

次は原本の構造を採用し、本repositoryの実構成へ読み替えています。

- frontend -> client/ のReact + TypeScript client
- backend -> src/mj_prompt_studio/ のlocalhost Python API
- UI runtime -> React clientとlocalhost APIのboundedなlocal実行
- storage -> SQLite、local asset store、settings、job queue
- external AI -> 固定LLM execution policy、mock / fake / contract test、明示manual opt-inの実API調査
- security boundary -> API key、Privacy mode、prompt・画像・local assetの最小送信と非公開境界

## 適用しない原本事項

- Cloud Run、Firebase Hosting、Firestore、Web認証、production deployment固有の運用契約
- WordPack固有の製品機能、domain、DB、deployment設定、画面名
- 過去のUI/UX report、screenshot、plan、evidence artifact
- 特定review bot、特定GitHub client、固定回数のreviewを前提にする規則

過去のreports、evidence、plansは履歴と証跡として保全し、現行正本へ取り込みません。

## 外部仕様

- Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- Claude Code memory / rules: https://code.claude.com/docs/ja/memory
- Claude Code Skills: https://code.claude.com/docs/ja/skills
- Cursor Rules: https://docs.cursor.com/context/rules
- Web Content Accessibility Guidelines: https://www.w3.org/WAI/standards-guidelines/wcag/

外部仕様の一時的な製品挙動を確認なしにhard gateへ格上げしません。仕様変更時は本repositoryのadapterとstatic検証の影響を確認します。

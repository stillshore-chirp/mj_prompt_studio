# Canonical Sources

MJ Prompt StudioのAIエージェントハーネスとUI/UXガバナンスは、次の原本と外部標準を参照しています。

## Wordpack原本

- Repository: `stillshore-chirp/wordpack-for-english`
- 同期基準commit: `d7d4e3ca9d40e2c54ca9fa430a05dce721b2c2d9`
- 同期日: 2026-08-09
- 主な原本:
  - `AGENTS.md`
  - `docs/agent-harness.md`
  - `docs/agent-principles.md`
  - `.agents/skills/`
  - `docs/ai-governance/`
  - `scripts/verify-agent-harness.sh`
  - `scripts/verify-ai-governance.sh`

前回の同期基準はcommit `51f042a9af3d24245a4aa0aae51d070d09fbf56d` でした。今回の同期では、Codex・Claude Code・Cursorの3製品を対象とするcommon / path / task / machineの4層構成、instruction budget、thin adapter、tool中立なGitHub配送、latest meaningful changeに基づくreview収束を取り込みました。

## MJ Prompt Studio向け適合

次は原本から概念を採用し、MJ Prompt Studioの実構成へ読み替えています。

- `apps/frontend/` -> `client/`
- `apps/backend/` -> `src/mj_prompt_studio/`
- Cloud Run / Firebase / Firestoreの本番調査 -> package artifact、installed app、real OpenAI API、SQLite、asset store、OS資格情報ストアの実環境調査
- Web認証・認可 -> localhost app、API key、Privacy mode、local credential境界
- Wordpack固有の画面・E2E command -> MJ Prompt StudioのVite / Vitest / Playwright / Make targets

次は適用していません。

- Cloud Run、Firebase Hosting、Firestore、Web認証の運用契約
- Wordpackの製品機能、domain、DB、deployment設定
- 過去のUI/UX report、screenshot、plan
- 特定review botや特定GitHub clientを前提にする規則

## 外部仕様

- Codex `AGENTS.md`: https://developers.openai.com/codex/guides/agents-md
- Claude Code memory / rules: https://code.claude.com/docs/ja/memory
- Claude Code Skills: https://code.claude.com/docs/ja/skills
- Cursor Rules: https://docs.cursor.com/context/rules
- Web Content Accessibility Guidelines (WCAG): https://www.w3.org/WAI/standards-guidelines/wcag/

外部仕様の一時的な製品挙動を、確認なしにhard gateへ格上げしません。仕様変更時はadapterと検証scriptを同じ変更内で更新します。

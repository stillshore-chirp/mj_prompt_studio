# ガバナンス保守方針

## 正本の分離

- 実行ゲートの入口: `AGENTS.md`
- 汎用詳細正本: `docs/ai-governance/`
- MJ Prompt Studio固有正本: `docs/process/mj-prompt-studio-rules.md` と関連設計docs
- 公開安全性: `docs/security-publication-checklist.md`
- UI/UX実行手順: `.agents/skills/ui-ux-review/SKILL.md`
- `CLAUDE.md`: `@AGENTS.md` だけを置く

同じ長文をtool別ファイルへ複製せず、入口から詳細正本を参照します。ルールが競合する場合は放置せず、scopeと優先順位を明確にして重複を統合します。

## 更新時の確認

- ユーザー価値、初見理解、a11y、状態、効率、信頼のbalanceが崩れていない。
- 観察可能なPass/Failと証跡につながる。
- P0/P1/P2が妥当で、P0を根拠なく格下げしていない。
- AI simulationと実ユーザーテストを混同しない。
- 既存のアプリ固有禁止事項、固定LLM policy、privacy、local asset境界を弱めない。
- AGENTS.mdが32KiB未満である。

## 標準・研究

標準・仕様、安定したHCI原則、認知accessibility、最新研究、単発研究の順に強制力を判断します。単発研究は直ちにP0化せず検証仮説として扱います。

## 言語と検証

判断基準と作業指示は日本語で保守し、技術識別子や標準名だけ英語を許容します。構造変更後は次を実行します。

```bash
bash scripts/verify-ai-governance.sh
git diff --check
```

# 参照する標準・実務知見

参照名だけでreviewを終えず、画面上の観察点、Pass/Fail、証跡、修正案へ変換します。

## 標準・ガイド

- W3C WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
- W3C Cognitive and Learning Disabilities Accessibility: <https://www.w3.org/TR/coga-usable/>
- Digital Agency Design System タイポグラフィ: <https://design.digital.go.jp/dads/foundations/typography/accessibility/>
- Nielsen Norman Group usability heuristics: <https://www.nngroup.com/articles/ten-usability-heuristics/>
- OpenAI Codex AGENTS.md: <https://developers.openai.com/codex/guides/agents-md>
- OpenAI Codex Agent Skills: <https://developers.openai.com/codex/skills>

## 移植元

本ガバナンスは `stillshore-chirp/wordpack-for-english` の `main`、commit `51f042a9af3d24245a4aa0aae51d070d09fbf56d` にある運用・UI/UXルールを基準に、MJ Prompt StudioのReact client、localhost API、固定LLM policy、ローカル資産境界へ適合しました。参照元固有のCloud Run、Firebase、Firestore、認証、過去report/evidenceは移植していません。

## 研究の扱い

対象ユーザー・task・環境を確認し、既存標準と整合させ、観察点とPass/Failへ変換できるかを判断します。出典不明blog、SNS、極端な単発実験、流行だけの記事、tool都合だけの規約はP0の根拠にしません。

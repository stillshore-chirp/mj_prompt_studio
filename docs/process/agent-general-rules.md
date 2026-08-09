# 汎用エージェントルール（互換入口）

このfileは、過去のlinkを壊さないために残す互換入口です。現在の正本は次へ移動しました。

- 常時読込の共通契約: [`AGENTS.md`](../../AGENTS.md)
- rule配置と3製品互換性: [`docs/agent-harness.md`](../agent-harness.md)
- 設計・実装heuristic: [`docs/agent-principles.md`](../agent-principles.md)
- 長期taskの進行補助: [`docs/process/task-execution.md`](task-execution.md)
- MJ Prompt Studio固有契約: [`docs/process/mj-prompt-studio-rules.md`](mj-prompt-studio-rules.md)
- task固有手順: [`.agents/skills/`](../../.agents/skills/)

新しいrule本文をこのfileへ追加しません。全taskで必要なhard gateはroot、特定pathの契約はnested `AGENTS.md`、特定taskの手順はSkill、機械判定できる条件はscript / CIへ置きます。

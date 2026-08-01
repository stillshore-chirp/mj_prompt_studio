import { BrainCircuit } from "lucide-react";

import type { JsonObject, PromptDocument } from "../../shared/types/api";
import { displayAgentName } from "../../shared/utils/user-facing";

interface AIInspectorProps {
  document: PromptDocument;
  agentResult: JsonObject | null;
}

export function AIInspector({ document, agentResult }: AIInspectorProps) {
  const missingDecisions = readStringList(agentResult, "missing_decisions");
  const nextActions = readStringList(agentResult, "next_actions");
  return (
    <section className="inspector-section" aria-label="AIの状況">
      <div className="panel-title-row">
        <h2>AIの状況</h2>
        <BrainCircuit size={16} />
      </div>
      <dl className="meta-list">
        <div>
          <dt>直近のAI支援</dt>
          <dd>{displayAgentName(document.llm_context.last_agent)}</dd>
        </div>
        <div>
          <dt>使用中のモデル</dt>
          <dd>{document.llm_context.model}</dd>
        </div>
      </dl>
      <h3>まだ決めること</h3>
      <ul className="compact-list">
        {missingDecisions.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {missingDecisions.length === 0 && <li>なし</li>}
      </ul>
      <h3>次にできること</h3>
      <ul className="compact-list">
        {nextActions.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {nextActions.length === 0 && <li>なし</li>}
      </ul>
    </section>
  );
}

function readStringList(source: JsonObject | null, key: string): string[] {
  const value = source?.[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    if (typeof item === "string") {
      return item;
    }
    if (typeof item === "object" && item !== null && "question" in item) {
      return String(item.question);
    }
    return String(item);
  });
}

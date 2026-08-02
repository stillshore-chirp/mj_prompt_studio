import { BrainCircuit } from "lucide-react";

import type { JsonObject, PromptDocument, RuntimeSettingsPublic } from "../../shared/types/api";
import { displayAgentName, displayExecutionDetails } from "../../shared/utils/user-facing";

interface AIInspectorProps {
  document: PromptDocument;
  agentResult: JsonObject | null;
  executionProfile: Pick<
    RuntimeSettingsPublic,
    "effective_model" | "effective_reasoning_effort" | "effective_text_verbosity" | "execution_backend"
  >;
}

export function AIInspector({ document, agentResult, executionProfile }: AIInspectorProps) {
  const missingDecisions = readStringList(agentResult, "missing_decisions");
  const nextActions = readStringList(agentResult, "next_actions");
  const hasExecutionHistory = Boolean(document.llm_context.last_agent);
  const historyMatchesCurrent =
    document.llm_context.model === executionProfile.effective_model &&
    document.llm_context.reasoning_effort === executionProfile.effective_reasoning_effort &&
    document.llm_context.text_verbosity === executionProfile.effective_text_verbosity;
  return (
    <section className="inspector-section" aria-label="AIの状況">
      <div className="panel-title-row">
        <h2>AIの状況</h2>
        <BrainCircuit size={16} />
      </div>
      <dl className="meta-list">
        <div>
          <dt>現在の固定AI構成</dt>
          <dd>
            {executionProfile.execution_backend === "openai"
              ? displayExecutionDetails(
                  executionProfile.effective_model,
                  executionProfile.effective_reasoning_effort,
                  executionProfile.effective_text_verbosity
                )
              : executionProfile.execution_backend === "mock"
                ? "Mock（外部APIは実行していません）"
                : "実行不可（API keyを設定してください）"}
          </dd>
        </div>
      </dl>
      <p className="scope-note">この構成は設定画面と共通です。ここから変更することはできません。</p>
      <h3>保存済みのAI実行履歴</h3>
      {hasExecutionHistory ? (
        <>
          <dl className="meta-list">
            <div>
              <dt>最後に実行したAI支援</dt>
              <dd>{displayAgentName(document.llm_context.last_agent)}</dd>
            </div>
            <div>
              <dt>実行時の構成</dt>
              <dd>
                {document.llm_context.execution_backend === "mock"
                  ? "Mock（外部APIは実行していません）"
                  : displayExecutionDetails(
                      document.llm_context.model,
                      document.llm_context.reasoning_effort,
                      document.llm_context.text_verbosity
                    )}
              </dd>
            </div>
          </dl>
          <p className="scope-note">
            {document.llm_context.execution_backend === "mock"
              ? "この履歴はMock実行です。実APIへの送信は行われていません。"
              : historyMatchesCurrent
              ? "この履歴は現在の固定AI構成と一致しています。"
              : "この履歴は過去の実行記録で、現在の固定AI構成とは異なります。次のAI支援は現在の固定AI構成で実行され、ここに表示した履歴は変更されません。"}
          </p>
        </>
      ) : (
        <p className="scope-note">まだ保存済みのAI実行履歴はありません。最初のAI支援を実行すると、実行時の構成をここで確認できます。</p>
      )}
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

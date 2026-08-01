import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AIInspector } from "../src/features/ai-inspector/AIInspector";
import { PromptDoctorPanel } from "../src/features/prompt-doctor/PromptDoctorPanel";
import type { PromptDocument } from "../src/shared/types/api";
import { displayAgentName, displayFieldName, displayValue } from "../src/shared/utils/user-facing";

const document = {
  llm_context: { last_agent: "ParameterAdvisorAgent", model: "gpt-5.6-luna" }
} as PromptDocument;

describe("user-facing copy", () => {
  it("内部識別子を制作上の表示名へ変換する", () => {
    expect(displayFieldName("blocks.composition")).toBe("構図");
    expect(displayAgentName("PromptDoctorAgent")).toBe("Prompt Doctorの確認");
    expect(displayValue({ internal: "value" })).toBe("設定済み");
  });

  it("InspectorとPrompt Doctorは内部名を主要情報として表示しない", () => {
    render(
      <>
        <AIInspector document={document} agentResult={null} />
        <PromptDoctorPanel
          validationReport={null}
          patches={[
            {
              field_path: "blocks.composition",
              old_value: "wide",
              new_value: "close",
              reason: "構図を比較しやすくします",
              confidence: 0.8,
              requires_user_confirmation: true
            }
          ]}
          onRun={vi.fn()}
          onApplyPatch={vi.fn()}
        />
      </>
    );

    expect(screen.getByText("パラメータの提案")).toBeVisible();
    expect(screen.getByText(/構図 \/ 提案の確からしさ 80%/)).toBeVisible();
    expect(screen.queryByText("blocks.composition")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prompt Doctorで確認する" })).toBeVisible();
  });
});

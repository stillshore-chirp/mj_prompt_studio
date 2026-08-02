import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AIInspector } from "../src/features/ai-inspector/AIInspector";
import { PromptDoctorPanel } from "../src/features/prompt-doctor/PromptDoctorPanel";
import type { PromptDocument } from "../src/shared/types/api";
import { displayAgentName, displayFieldName, displayValue } from "../src/shared/utils/user-facing";

const executionProfile = {
  effective_model: "gpt-5.6-luna",
  effective_reasoning_effort: "high",
  effective_text_verbosity: "low",
  execution_backend: "openai" as const
};

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
        <AIInspector document={document} agentResult={null} executionProfile={executionProfile} />
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

  it("現在の固定構成と異なる保存済み履歴を区別して説明する", () => {
    const legacyDocument = {
      llm_context: {
        last_agent: "PromptDoctorAgent",
        model: "gpt-4.1",
        reasoning_effort: "medium",
        text_verbosity: "medium"
      }
    } as PromptDocument;

    render(<AIInspector document={legacyDocument} agentResult={null} executionProfile={executionProfile} />);

    expect(screen.getByText("現在の固定AI構成")).toBeVisible();
    expect(screen.getByText("GPT-5.6 Luna・高い推論・簡潔な応答")).toBeVisible();
    expect(screen.getByText("保存済みのAI実行履歴")).toBeVisible();
    expect(screen.getByText("Prompt Doctorの確認")).toBeVisible();
    expect(screen.getByText("gpt-4.1・medium・medium")).toBeVisible();
    expect(
      screen.getByText(/過去の実行記録で、現在の固定AI構成とは異なります。次のAI支援は現在の固定AI構成で実行され、ここに表示した履歴は変更されません。/)
    ).toBeVisible();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("Mock実行の履歴を実APIの実行として表示しない", () => {
    const mockDocument = {
      llm_context: {
        last_agent: "PromptDoctorAgent",
        model: "gpt-5.6-luna",
        reasoning_effort: "high",
        text_verbosity: "low",
        execution_backend: "mock"
      }
    } as PromptDocument;

    render(<AIInspector document={mockDocument} agentResult={null} executionProfile={executionProfile} />);

    expect(screen.getByText("Mock（外部APIは実行していません）")).toBeInTheDocument();
    expect(screen.getByText("この履歴はMock実行です。実APIへの送信は行われていません。")).toBeVisible();
  });
});

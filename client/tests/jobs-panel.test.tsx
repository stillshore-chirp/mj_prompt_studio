import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobsPanel } from "../src/features/jobs/JobsPanel";

describe("JobsPanel", () => {
  it("shows the effective model, reasoning, and response detail", () => {
    render(
      <JobsPanel
        jobs={[
          {
            id: "job_1",
            agent_name: "VocabularyAgent",
            model: "gpt-5.6-luna",
            reasoning_effort: "high",
            text_verbosity: "low",
            status: "succeeded",
            input_snapshot: {},
            output_json: {},
            error_message: null,
            created_at: "2026-08-01T00:00:00Z",
            finished_at: "2026-08-01T00:00:01Z",
            retry_count: 0
          }
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("gpt-5.6-luna · high · low detail")).toBeInTheDocument();
  });
});

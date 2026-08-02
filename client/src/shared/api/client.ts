import type {
  AgentJobResponse,
  ArrangePreset,
  DocumentResponse,
  JsonObject,
  LLMFeaturePreferences,
  LLMJob,
  MatrixPlan,
  MatrixVariant,
  PromptBlocks,
  PromptDocument,
  PromptParameters,
  PromptPatch,
  ReferenceAsset,
  ResultImage,
  ResultReview,
  RuntimeSettingsPublic,
  StoredApiKeyLoadResponse,
  WorkspaceResponse
} from "../types/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly kind: "http" | "network" | "schema",
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const API_BASE = import.meta.env.VITE_MJPS_API_BASE ?? "";
const LOCAL_API_REQUEST_HEADER = "X-MJPS-Request";

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...init.headers
      }
    });
    if (!response.ok) {
      const detail = await errorDetails(response);
      throw new ApiClientError(detail.message, "http", response.status, detail.code);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError("ローカルAPIへ接続できません。", "network");
  }
}

async function requestText(path: string, init: RequestInit = {}): Promise<string> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });
  if (!response.ok) {
    const detail = await errorDetails(response);
    throw new ApiClientError(detail.message, "http", response.status, detail.code);
  }
  return response.text();
}

async function errorDetails(response: Response): Promise<{ message: string; code?: string }> {
  try {
    const payload = (await response.json()) as { detail?: string | { message?: string; code?: string } };
    if (typeof payload.detail === "string") {
      return { message: payload.detail };
    }
    if (payload.detail?.message) {
      return { message: payload.detail.message, code: payload.detail.code };
    }
  } catch {
    return { message: response.statusText };
  }
  return { message: response.statusText };
}

export interface SaveDocumentPayload {
  user_brief: string;
  blocks: PromptBlocks;
  parameters: PromptParameters;
  notes: string;
  tags: string[];
}

export const api = {
  workspace: () => requestJson<WorkspaceResponse>("/api/workspace"),
  jobs: () => requestJson<{ jobs: LLMJob[] }>("/api/jobs"),
  job: (jobId: string) => requestJson<{ job: LLMJob }>(`/api/jobs/${jobId}`),
  cancelJob: (jobId: string) =>
    requestJson<{ cancelled: boolean }>(`/api/jobs/${jobId}/cancel`, { method: "POST" }),
  retryJob: (jobId: string) =>
    requestJson<{ job: LLMJob }>(`/api/jobs/${jobId}/retry`, { method: "POST" }),
  createProject: (name: string, title: string) =>
    requestJson<{ project: WorkspaceResponse["project"]; document: PromptDocument }>(
      "/api/projects",
      { method: "POST", body: JSON.stringify({ name, title }) }
    ),
  openProject: (projectId: string) =>
    requestJson<{ project: WorkspaceResponse["project"]; document: PromptDocument }>(
      `/api/projects/${projectId}/open`,
      { method: "POST" }
    ),
  saveBlocks: (documentId: string, payload: SaveDocumentPayload) =>
    requestJson<DocumentResponse>(`/api/prompt-documents/${documentId}/blocks`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  compile: (documentId: string, payload: SaveDocumentPayload) =>
    requestJson<DocumentResponse>(`/api/prompt-documents/${documentId}/compile`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  applyPatch: (documentId: string, patch: PromptPatch) =>
    requestJson<DocumentResponse>(`/api/prompt-documents/${documentId}/patches/apply`, {
      method: "POST",
      body: JSON.stringify({ patch, confirmed: true })
    }),
  undo: (documentId: string) =>
    requestJson<DocumentResponse>(`/api/prompt-documents/${documentId}/undo`, {
      method: "POST"
    }),
  redo: (documentId: string) =>
    requestJson<DocumentResponse>(`/api/prompt-documents/${documentId}/redo`, {
      method: "POST"
    }),
  revisions: (documentId: string) =>
    requestJson<{ revisions: JsonObject[] }>(`/api/prompt-documents/${documentId}/revisions`),
  intentIntake: (documentId: string, brief: string) =>
    requestJson<AgentJobResponse>("/api/agents/intent-intake", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId, brief })
    }),
  vocabulary: (payload: {
    text: string;
    mode?: string;
    field_name?: string;
    source_text?: string;
  }) =>
    requestJson<AgentJobResponse>("/api/agents/vocabulary", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  compileReview: (documentId: string) =>
    requestJson<AgentJobResponse>("/api/agents/compile-review", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId })
    }),
  promptDoctor: (documentId: string) =>
    requestJson<AgentJobResponse>("/api/agents/prompt-doctor", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId })
    }),
  parameterAdvisor: (documentId: string, objective: string) =>
    requestJson<AgentJobResponse>("/api/agents/parameter-advisor", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId, objective })
    }),
  referenceAnalyzer: (referenceId: string) =>
    requestJson<AgentJobResponse>("/api/agents/reference-analyzer", {
      method: "POST",
      body: JSON.stringify({ reference_id: referenceId })
    }),
  matrixPlan: (objective: string) =>
    requestJson<AgentJobResponse>("/api/matrix/plan", {
      method: "POST",
      body: JSON.stringify({ objective })
    }),
  matrixGenerate: (projectId: string, plan: MatrixPlan, basePrompt: string) =>
    requestJson<{ variants: MatrixVariant[] }>("/api/matrix/generate", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, plan, base_prompt: basePrompt })
    }),
  matrixCsv: (variants: MatrixVariant[]) =>
    requestText("/api/matrix/export/csv", {
      method: "POST",
      body: JSON.stringify({ variants })
    }),
  matrixMarkdown: (plan: MatrixPlan, variants: MatrixVariant[]) =>
    requestText("/api/matrix/export/markdown", {
      method: "POST",
      body: JSON.stringify({ plan, variants })
    }),
  uploadReference: (projectId: string, file: File) => {
    const form = new FormData();
    form.set("file", file);
    return requestJson<{ reference: ReferenceAsset }>(
      `/api/projects/${projectId}/references/upload`,
      { method: "POST", body: form }
    );
  },
  updateReferenceTags: (referenceId: string, tags: string[]) =>
    requestJson<{ reference: ReferenceAsset }>(`/api/references/${referenceId}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tags })
    }),
  deleteReference: async (referenceId: string) => {
    const response = await fetch(`${API_BASE}/api/references/${referenceId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const detail = await errorDetails(response);
      throw new ApiClientError(detail.message, "http", response.status, detail.code);
    }
  },
  uploadResult: (documentId: string, file: File) => {
    const form = new FormData();
    form.set("file", file);
    return requestJson<{ result_image: ResultImage }>(
      `/api/prompt-documents/${documentId}/results/upload`,
      { method: "POST", body: form }
    );
  },
  resultReview: (resultImageId: string) =>
    requestJson<AgentJobResponse>(`/api/results/${resultImageId}/review`, {
      method: "POST"
    }),
  resultReviews: (resultImageId: string) =>
    requestJson<{ reviews: ResultReview[] }>(`/api/results/${resultImageId}/reviews`),
  compareResults: (projectId: string) =>
    requestJson<{ lines: string[] }>("/api/results/compare", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId })
    }),
  finalAudit: (documentId: string) =>
    requestJson<AgentJobResponse>("/api/agents/final-audit", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId })
    }),
  promptGenerator: (payload: {
    count: number;
    chaos_level: number;
    output_language: "en" | "ja";
    guidance: string;
    deduplicate: boolean;
  }) =>
    requestJson<AgentJobResponse>("/api/agents/prompt-generator", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  promptTransform: (payload: {
    mode: "worldbuilding" | "chaos_mix";
    source_prompt: string;
    output_language: "source" | "en" | "ja";
    max_characters: number | null;
    additional_guidance: string;
  }) =>
    requestJson<AgentJobResponse>("/api/agents/prompt-transform", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  promptLengthAdjust: (payload: {
    source_prompt: string;
    length_ratio: number;
    max_characters: number | null;
  }) =>
    requestJson<AgentJobResponse>("/api/agents/prompt-length-adjust", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  promptArrangePresets: () =>
    requestJson<{ presets: ArrangePreset[]; warning: string | null }>("/api/prompt-arrange-presets"),
  promptArrange: (payload: {
    source_prompt: string;
    preset_id: string;
    strength: number;
    additional_guidance: string;
    length_ratio: number;
    max_characters: number | null;
    output_language: "source" | "en" | "ja";
  }) =>
    requestJson<AgentJobResponse>("/api/agents/prompt-arrange", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  settings: () => requestJson<{ settings: RuntimeSettingsPublic }>("/api/settings"),
  saveFeaturePreferences: (preferences: Record<string, LLMFeaturePreferences>) =>
    requestJson<{ settings: RuntimeSettingsPublic }>("/api/settings/feature-preferences", {
      method: "PUT",
      body: JSON.stringify({ preferences })
    }),
  saveResponseStorage: (responseStorage: "normal" | "privacy") =>
    requestJson<{ settings: RuntimeSettingsPublic }>("/api/settings/response-storage", {
      method: "PUT",
      body: JSON.stringify({ response_storage: responseStorage })
    }),
  saveTextOutputOptions: (includeOptions: boolean) =>
    requestJson<{ settings: RuntimeSettingsPublic }>("/api/settings/text-output-options", {
      method: "PUT",
      body: JSON.stringify({ include_midjourney_options_in_text_output: includeOptions })
    }),
  saveExclusionTerms: (terms: string[]) =>
    requestJson<{ settings: RuntimeSettingsPublic }>("/api/settings/exclusion-terms", {
      method: "PUT",
      body: JSON.stringify({ terms })
    }),
  setSessionApiKey: (apiKey: string) =>
    requestJson<{ settings: RuntimeSettingsPublic }>("/api/settings/session-api-key", {
      method: "POST",
      body: JSON.stringify({ api_key: apiKey })
    }),
  persistApiKey: (apiKey: string) =>
    requestJson<{ persisted: boolean; settings: RuntimeSettingsPublic }>(
      "/api/settings/persist-api-key",
      { method: "POST", body: JSON.stringify({ api_key: apiKey }) }
    ),
  loadPersistedApiKey: () =>
    requestJson<StoredApiKeyLoadResponse>("/api/settings/load-persisted-api-key", {
      method: "POST",
      headers: { [LOCAL_API_REQUEST_HEADER]: "1" }
    }),
  connectionTest: () =>
    requestJson<{ ok: boolean; error_code: string | null }>("/api/settings/connection-test", {
      method: "POST",
      headers: { [LOCAL_API_REQUEST_HEADER]: "1" }
    }),
  exportFile: (
    documentId: string,
    mode: "prompt" | "markdown_record" | "json_snapshot" | "matrix_csv" | "matrix_markdown",
    matrixPlan?: MatrixPlan,
    matrixVariants: MatrixVariant[] = []
  ) =>
    requestText("/api/exports/file", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        mode,
        matrix_plan: matrixPlan,
        matrix_variants: matrixVariants
      })
    })
};

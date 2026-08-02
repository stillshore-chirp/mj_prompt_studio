export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface ProjectRecord {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PromptBlocks {
  intent: string;
  subject: string;
  action_state: string;
  environment: string;
  composition: string;
  camera_lens: string;
  lighting: string;
  material_texture: string;
  color_palette: string;
  style: string;
  text_in_image: string[];
  positive_constraints: string;
  notes: string;
}

export interface PromptParameters {
  aspect_ratio: string | null;
  raw: boolean | null;
  stylize: number | null;
  chaos: number | null;
  weird: number | null;
  experimental: number | null;
  tile: boolean | null;
  seed: number | null;
  speed_mode: string | null;
  custom: JsonObject;
}

export interface PromptReferences {
  image_references: string[];
  style_references: string[];
  moodboards: string[];
  personalization_profiles: string[];
}

export interface LLMContext {
  latest_response_id: null;
  response_id_kind: "openai" | "mock" | null;
  last_agent: string | null;
  model: string;
  reasoning_effort: string;
  text_verbosity: string;
  user_vocab_snapshot_id: string | null;
  project_style_profile_id: string | null;
  execution_backend: "openai" | "mock" | "unavailable" | null;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  field_path: string | null;
}

export interface ValidationReport {
  issues: ValidationIssue[];
}

export interface PromptDocument {
  id: string;
  project_id: string;
  title: string;
  ruleset_id: string;
  user_brief: string;
  blocks: PromptBlocks;
  parameters: PromptParameters;
  references: PromptReferences;
  compiled_prompt: string;
  validation_report: ValidationReport | null;
  llm_context: LLMContext;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PromptPatch {
  field_path: string;
  old_value: JsonValue;
  new_value: JsonValue;
  reason: string;
  confidence: number;
  requires_user_confirmation: boolean;
}

export interface ReferenceAnalysis {
  summary: string;
  colors: string[];
  lighting: string;
  composition: string;
  material_texture: string;
  suggested_mode: string;
  extracted_vocabulary: string[];
  confidence: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format_name: string;
  file_size_bytes: number;
  dominant_colors: string[];
}

export interface ReferenceAsset {
  id: string;
  project_id: string;
  type: string;
  name: string;
  external_url: string | null;
  tags: string[];
  ai_analysis: ReferenceAnalysis;
  image_metadata: ImageMetadata;
  notes: string;
  created_at: string;
  updated_at: string;
  asset_url: string;
}

export interface ResultImage {
  id: string;
  project_id: string;
  prompt_document_id: string;
  prompt_snapshot: string;
  parameters_snapshot: JsonObject;
  image_metadata: ImageMetadata;
  created_at: string;
  asset_url: string;
}

export interface ResultReview {
  id: string;
  result_image_id: string;
  scores: Record<string, number>;
  strengths: string[];
  issues: string[];
  next_prompt_candidates: string[];
  ai_summary: string;
  reviewer: string;
  created_at: string;
}

export interface MatrixAxis {
  name: string;
  values: JsonValue[];
  description: string;
}

export interface MatrixPlan {
  id: string;
  objective: string;
  fixed_conditions: JsonObject;
  axes: MatrixAxis[];
  evaluation_points: string[];
  max_variants: number;
}

export interface MatrixVariant {
  id: string;
  index: number;
  parameters: JsonObject;
  prompt: string;
  notes: string;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type ExecutionBackend = "openai" | "mock" | "unavailable";

export interface LLMJob {
  id: string;
  agent_name: string;
  model: string;
  reasoning_effort: string;
  text_verbosity: string;
  status: JobStatus;
  input_snapshot: JsonObject;
  output_json: JsonObject | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
  retry_count: number;
  configured_mode: "real" | "mock";
  execution_backend: ExecutionBackend;
  api_key_configured: boolean;
  response_id_kind: "openai" | "mock" | null;
}

export interface ParameterSpec {
  name: string;
  display_name: string;
  kind: "boolean" | "integer" | "number" | "string" | "enum";
  flag: string;
  ui_visible: boolean;
  export_enabled: boolean;
  minimum: number | null;
  maximum: number | null;
  choices: string[];
  description: string;
}

export interface ReferenceModeSpec {
  name: string;
  display_name: string;
  enabled: boolean;
  description: string;
}

export interface RulesetDisplay {
  display_name: string;
  ui_expose_identifier: boolean;
  capabilities: Record<string, boolean>;
  parameters: ParameterSpec[];
  reference_modes: ReferenceModeSpec[];
}

export interface LLMFeaturePreferences {
  vocabulary_amount: string;
}

export interface RuntimeSettingsPublic {
  llm_mode: string;
  configured_mode: "real" | "mock";
  execution_backend: ExecutionBackend;
  execution_error_code: string | null;
  response_storage: "normal" | "privacy";
  include_midjourney_options_in_text_output: boolean;
  prompt_exclusion_terms: string[];
  prompt_exclusion_term_limit: number;
  prompt_exclusion_term_max_length: number;
  privacy_mode: boolean;
  api_key_configured: boolean;
  api_key_source: "environment" | "credential_store" | "session" | "not_configured";
  credential_store_status: "available" | "not_configured" | "unavailable" | "not_checked";
  feature_preferences: Record<string, LLMFeaturePreferences>;
  feature_display_names: Record<string, string>;
  effective_model: string;
  effective_reasoning_effort: string;
  effective_text_verbosity: string;
  vocabulary_amounts: string[];
  vocabulary_amount_labels: Record<string, string>;
  ruleset: RulesetDisplay;
}

export interface ArrangePreset {
  id: string;
  label_ja: string;
  category: string;
  hybridization_profile: string | null;
}

export interface PromptWorkshopPrompt {
  text: string;
  language: "en" | "ja";
}

export interface PromptWorkshopResult {
  target: "prompt_workshop";
  operation: string;
  prompt?: string;
  body?: string;
  prompts?: PromptWorkshopPrompt[];
  requested_count?: number;
  generated_count?: number;
  excluded_count?: number;
  status?: string;
  source_body_count?: number;
  result_body_count?: number;
  preserved_anchors?: string[];
  preserved_anchor_count?: number;
  warnings?: string[];
  omitted_elements?: string[];
  preset_id?: string;
  preset_label?: string;
  strength?: number;
  length_ratio?: number;
  original_body_count?: number;
  target_count?: number;
  result_count?: number;
  max_characters?: number | null;
  quality_repair_attempts?: number;
  exclusion_terms_applied?: boolean;
}

export interface StoredApiKeyLoadResponse {
  loaded: boolean;
  settings: RuntimeSettingsPublic;
}

export interface WorkspaceResponse {
  project: ProjectRecord;
  document: PromptDocument;
  projects: ProjectRecord[];
  references: ReferenceAsset[];
  result_images: ResultImage[];
  ruleset: RulesetDisplay;
  settings: RuntimeSettingsPublic;
  jobs: LLMJob[];
}

export interface AgentJobResponse {
  job: LLMJob;
}

export interface DocumentResponse {
  document: PromptDocument;
}

export interface ApiErrorPayload {
  detail?: string;
}

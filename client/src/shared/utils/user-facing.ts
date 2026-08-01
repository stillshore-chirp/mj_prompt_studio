import type { JsonValue, PromptPatch } from "../types/api";

const fieldLabels: Record<string, string> = {
  "blocks.intent": "意図",
  "blocks.subject": "主題",
  "blocks.action_state": "動き・状態",
  "blocks.environment": "環境",
  "blocks.composition": "構図",
  "blocks.camera_lens": "カメラ・レンズ",
  "blocks.lighting": "照明",
  "blocks.material_texture": "素材・質感",
  "blocks.color_palette": "配色",
  "blocks.style": "スタイル",
  "blocks.text_in_image": "画像内テキスト",
  "blocks.positive_constraints": "守りたい条件",
  "blocks.notes": "メモ",
  aspect_ratio: "アスペクト比",
  raw: "Raw",
  stylize: "Stylize",
  chaos: "Chaos",
  weird: "Weird",
  experimental: "Experimental",
  tile: "Tile",
  seed: "Seed",
  speed_mode: "速度モード"
};

const agentLabels: Record<string, string> = {
  IntentIntakeAgent: "AI Briefの構造化",
  VocabularyAgent: "表現の調整",
  PromptDoctorAgent: "Prompt Doctorの確認",
  ParameterAdvisorAgent: "パラメータの提案",
  MatrixPlannerAgent: "Matrix計画の作成",
  ResultReviewAgent: "生成結果のレビュー",
  FinalAuditorAgent: "最終確認",
  ReferenceAnalyzerAgent: "参照素材の分析"
};

export function displayFieldName(fieldPath: string | null | undefined): string {
  if (!fieldPath) {
    return "変更項目";
  }
  return fieldLabels[fieldPath] ?? "追加設定";
}

export function displayAgentName(agentName: string | null | undefined): string {
  if (!agentName) {
    return "まだAI支援は実行されていません";
  }
  return agentLabels[agentName] ?? "AI支援";
}

export function displayPatch(patch: PromptPatch): { field: string; oldValue: string; newValue: string } {
  return {
    field: displayFieldName(patch.field_path),
    oldValue: displayValue(patch.old_value),
    newValue: displayValue(patch.new_value)
  };
}

export function displayValue(value: JsonValue | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "未設定";
  }
  if (typeof value === "boolean") {
    return value ? "有効" : "無効";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => displayValue(item)).join("、") || "未設定";
  }
  return "設定済み";
}

export function displayExecutionDetails(model: string, reasoning: string, verbosity: string): string {
  const modelLabel = model === "gpt-5.6-luna" ? "GPT-5.6 Luna" : model;
  const reasoningLabel = reasoning === "high" ? "高い推論" : reasoning;
  const verbosityLabel = verbosity === "low" ? "簡潔な応答" : verbosity;
  return `${modelLabel}・${reasoningLabel}・${verbosityLabel}`;
}

import type { LLMFailureCode, LLMFailureStage, LLMJob } from "../types/api";
import { displayAgentName } from "./user-facing";

export interface JobFailureDisplay {
  summary: string;
  recovery: string;
  canRetry: boolean;
  requiresSettings: boolean;
  retryGuidance: string;
}

const unknownFailure: JobFailureDisplay = {
  summary: "この履歴には原因を判定する診断情報がありません。",
  recovery: "この履歴から原因は復元できません。再試行せず、アプリを更新・再起動してから新しく1回だけ実行してください。",
  canRetry: false,
  requiresSettings: false,
  retryGuidance: "この履歴からの再試行は推奨しません"
};

const failureDisplays: Record<LLMFailureCode, JobFailureDisplay> = {
  api_key_missing: {
    summary: "AIを実行するためのAPI keyが設定されていません。",
    recovery: "設定でAPI keyを適用してから、再試行してください。",
    canRetry: true,
    requiresSettings: true,
    retryGuidance: "API keyの設定後に再試行できます"
  },
  client_initialization_failed: {
    summary: "実APIを使う準備を完了できませんでした。",
    recovery: "設定を確認し、アプリを再起動してから再試行してください。",
    canRetry: true,
    requiresSettings: true,
    retryGuidance: "アプリの再起動後に再試行できます"
  },
  api_authentication_failed: {
    summary: "実APIの認証を確認できませんでした。",
    recovery: "設定でAPI keyを確認または適用してから、再試行してください。",
    canRetry: true,
    requiresSettings: true,
    retryGuidance: "API keyの確認後に再試行できます"
  },
  api_permission_denied: {
    summary: "このAPI keyには必要な実APIの利用権限がありません。",
    recovery: "設定のAPI keyと、そのkeyに紐づくプロジェクトの権限を確認してから再試行してください。",
    canRetry: true,
    requiresSettings: true,
    retryGuidance: "権限の確認後に再試行できます"
  },
  api_quota_exhausted: {
    summary: "実APIの利用枠または請求上限に達したため処理できませんでした。",
    recovery: "OpenAI Platformで利用枠・請求状態を確認し、必要な更新後に再試行してください。",
    canRetry: true,
    requiresSettings: false,
    retryGuidance: "利用枠・請求状態の更新後に再試行できます"
  },
  rate_limited: {
    summary: "実APIの一時的なリクエスト制限のため処理できませんでした。",
    recovery: "少し待ってから、元の操作をもう一度実行してください。",
    canRetry: false,
    requiresSettings: false,
    retryGuidance: "待機後に元の操作を新しく実行してください"
  },
  network_unavailable: {
    summary: "実APIへ接続できませんでした。",
    recovery: "ネットワークを確認してから、再試行してください。",
    canRetry: true,
    requiresSettings: false,
    retryGuidance: "接続の確認後に再試行できます"
  },
  api_unavailable: {
    summary: "実API側の一時的な問題で処理できませんでした。",
    recovery: "少し待ってから、元の操作をもう一度実行してください。",
    canRetry: false,
    requiresSettings: false,
    retryGuidance: "待機後に元の操作を新しく実行してください"
  },
  api_request_invalid: {
    summary: "実APIがこの処理のリクエストを受け付けませんでした。",
    recovery: "再試行せず、「診断情報をコピー」から内容を確認・報告してください。",
    canRetry: false,
    requiresSettings: false,
    retryGuidance: "原因を確認するまで再試行しないでください"
  },
  response_storage_rejected: {
    summary: "現在の応答保存設定では実APIがこの処理を受け付けませんでした。",
    recovery: "設定でPrivacy modeを確認し、必要に応じて有効にしてから再試行してください。",
    canRetry: true,
    requiresSettings: true,
    retryGuidance: "Privacy modeの変更後に再試行できます"
  },
  structured_output_schema_invalid: {
    summary: "この操作に必要な構造化形式を実APIが受け付けませんでした。",
    recovery: "入力は保持されています。再試行せず、アプリを更新してから元の操作を新しく実行してください。",
    canRetry: false,
    requiresSettings: false,
    retryGuidance: "アプリの更新前は再試行しないでください"
  },
  structured_output_invalid: {
    summary: "実APIの応答をこの操作に必要な形式として確認できませんでした。",
    recovery: "入力は保持されています。もう一度実行しても続く場合は、設定を確認してください。",
    canRetry: true,
    requiresSettings: false,
    retryGuidance: "同じ入力で1回だけ再試行できます"
  },
  unexpected: {
    summary: "原因を安全に判定できませんでした。",
    recovery: "再試行せず、「診断情報をコピー」から内容を確認・報告してください。",
    canRetry: false,
    requiresSettings: false,
    retryGuidance: "原因を確認するまで再試行しないでください"
  }
};

export function displayJobFailure(
  code: LLMFailureCode | null,
  providerErrorCode?: string | null
): JobFailureDisplay {
  const safeCode = safeProviderErrorCode(providerErrorCode);
  if (safeCode === "model_not_found") {
    return {
      summary: "アプリが指定した固定実行モデルを利用できませんでした。",
      recovery: "再試行せず、「診断情報をコピー」から内容を確認・報告してください。",
      canRetry: false,
      requiresSettings: false,
      retryGuidance: "アプリ側の実行設定が更新されるまで再試行しないでください"
    };
  }
  if (["unsupported_parameter", "invalid_value", "invalid_request_error"].includes(safeCode ?? "")) {
    return {
      summary: "アプリのAPIリクエストが現在の実API仕様と一致しませんでした。",
      recovery: "再試行せず、「診断情報をコピー」から内容を確認・報告してください。",
      canRetry: false,
      requiresSettings: false,
      retryGuidance: "アプリ側の修正を確認するまで再試行しないでください"
    };
  }
  return code ? failureDisplays[code] : unknownFailure;
}

export function isLLMFailureCode(code: string | null | undefined): code is LLMFailureCode {
  return code !== null && code !== undefined && code in failureDisplays;
}

const stageLabels: Record<LLMFailureStage, string> = {
  execution_setup: "実行準備",
  request: "APIリクエスト",
  response_validation: "応答形式の確認",
  semantic_validation: "応答内容の確認",
  unknown: "判定不能"
};

const safeProviderCodes = new Set([
  "credit_balance_exhausted",
  "insufficient_quota",
  "invalid_api_key",
  "invalid_request_error",
  "invalid_value",
  "model_not_found",
  "organization_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
  "project_spend_limit_exceeded",
  "rate_limit_exceeded",
  "server_error",
  "unsupported_parameter"
]);

export function displayFailureStage(stage: LLMFailureStage | null | undefined): string {
  if (!stage) {
    return "記録なし（旧履歴）";
  }
  return stage in stageLabels ? stageLabels[stage] : "判定不能";
}

export function safeProviderStatusCode(value: number | null | undefined): number | null {
  return Number.isInteger(value) && value !== undefined && value !== null && value >= 400 && value <= 599
    ? value
    : null;
}

export function safeProviderErrorCode(value: string | null | undefined): string | null {
  return value && safeProviderCodes.has(value) ? value : null;
}

export function formatSafeJobDiagnostics(job: LLMJob): string {
  const statusCode = safeProviderStatusCode(job.provider_status_code);
  const providerCode = safeProviderErrorCode(job.provider_error_code);
  const failureCode = isLLMFailureCode(job.failure_code) ? job.failure_code : "記録なし";
  const failureStage = job.failure_stage && job.failure_stage in stageLabels
    ? job.failure_stage
    : "記録なし";
  const executionBackend = ["openai", "mock", "unavailable"].includes(job.execution_backend)
    ? job.execution_backend
    : "unavailable";
  const retryCount = Number.isInteger(job.retry_count) && job.retry_count >= 0
    ? job.retry_count
    : 0;
  return [
    "MJ Prompt Studio 安全な診断情報",
    `操作: ${displayAgentName(job.agent_name)}`,
    `失敗分類: ${failureCode}`,
    `失敗段階: ${failureStage}`,
    `HTTP状態: ${statusCode ?? "記録なし"}`,
    `Providerコード: ${providerCode ?? "記録なし"}`,
    `設定モード: ${job.configured_mode === "mock" ? "mock" : "real"}`,
    `実行経路: ${executionBackend}`,
    `API key: ${job.api_key_configured ? "設定済み" : "未設定"}`,
    `応答識別: ${job.response_id_kind ? "取得済み" : "未取得"}`,
    `再試行回数: ${retryCount}`,
    "除外済み: 入力内容、API key、生のprovider応答、request/job/trace ID"
  ].join("\n");
}

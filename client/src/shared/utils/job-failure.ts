import type { LLMFailureCode } from "../types/api";

export interface JobFailureDisplay {
  summary: string;
  recovery: string;
  canRetry: boolean;
  requiresSettings: boolean;
}

const unknownFailure: JobFailureDisplay = {
  summary: "実APIの処理を完了できませんでした。",
  recovery: "もう一度実行しても続く場合は、設定を確認してください。",
  canRetry: true,
  requiresSettings: true
};

const failureDisplays: Record<LLMFailureCode, JobFailureDisplay> = {
  api_key_missing: {
    summary: "AIを実行するためのAPI keyが設定されていません。",
    recovery: "設定でAPI keyを適用してから、再試行してください。",
    canRetry: true,
    requiresSettings: true
  },
  client_initialization_failed: {
    summary: "実APIを使う準備を完了できませんでした。",
    recovery: "設定を確認し、アプリを再起動してから再試行してください。",
    canRetry: true,
    requiresSettings: true
  },
  api_authentication_failed: {
    summary: "実APIの認証を確認できませんでした。",
    recovery: "設定でAPI keyを確認または適用してから、再試行してください。",
    canRetry: true,
    requiresSettings: true
  },
  api_permission_denied: {
    summary: "このAPI keyには必要な実APIの利用権限がありません。",
    recovery: "設定のAPI keyと、そのkeyに紐づくプロジェクトの権限を確認してから再試行してください。",
    canRetry: true,
    requiresSettings: true
  },
  rate_limited: {
    summary: "実APIの利用上限または一時的な混雑のため処理できませんでした。",
    recovery: "少し待ってから、元の操作をもう一度実行してください。",
    canRetry: false,
    requiresSettings: false
  },
  network_unavailable: {
    summary: "実APIへ接続できませんでした。",
    recovery: "ネットワークを確認してから、再試行してください。",
    canRetry: true,
    requiresSettings: false
  },
  api_unavailable: {
    summary: "実API側の一時的な問題で処理できませんでした。",
    recovery: "少し待ってから、元の操作をもう一度実行してください。",
    canRetry: false,
    requiresSettings: false
  },
  api_request_invalid: {
    summary: "実APIがこの処理のリクエストを受け付けませんでした。",
    recovery: "入力は保持されています。もう一度実行しても続く場合は、設定を確認してください。",
    canRetry: true,
    requiresSettings: true
  },
  response_storage_rejected: {
    summary: "現在の応答保存設定では実APIがこの処理を受け付けませんでした。",
    recovery: "設定でPrivacy modeを確認し、必要に応じて有効にしてから再試行してください。",
    canRetry: true,
    requiresSettings: true
  },
  structured_output_schema_invalid: {
    summary: "この操作に必要な構造化形式を実APIが受け付けませんでした。",
    recovery: "入力は保持されています。再試行しても続く場合は、アプリを更新してから再試行してください。",
    canRetry: true,
    requiresSettings: false
  },
  structured_output_invalid: {
    summary: "実APIの応答をこの操作に必要な形式として確認できませんでした。",
    recovery: "入力は保持されています。もう一度実行しても続く場合は、設定を確認してください。",
    canRetry: true,
    requiresSettings: true
  },
  unexpected: unknownFailure
};

export function displayJobFailure(code: LLMFailureCode | null): JobFailureDisplay {
  return code ? failureDisplays[code] : unknownFailure;
}

export function isLLMFailureCode(code: string | null | undefined): code is LLMFailureCode {
  return code !== null && code !== undefined && code in failureDisplays;
}

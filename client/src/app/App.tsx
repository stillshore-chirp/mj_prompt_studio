import {
  Download,
  FilePenLine,
  FolderOpen,
  Grid3X3,
  Images,
  PenLine,
  Plus,
  RotateCcw,
  ScanSearch,
  Settings,
  Undo2
} from "lucide-react";
import { KeyboardEvent as ReactKeyboardEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AIInspector } from "../features/ai-inspector/AIInspector";
import {
  AutoSuggestionState,
  ComposerPayload,
  ComposerView
} from "../features/composer/ComposerView";
import { ParameterInspector } from "../features/composer/ParameterInspector";
import { FreeEditorView } from "../features/free-editor/FreeEditorView";
import { HelpWidget } from "../features/help/HelpWidget";
import { JobsPanel } from "../features/jobs/JobsPanel";
import { MatrixLabView } from "../features/matrix-lab/MatrixLabView";
import { PromptDoctorPanel } from "../features/prompt-doctor/PromptDoctorPanel";
import { ReferenceLibraryView } from "../features/reference-library/ReferenceLibraryView";
import { ResultReviewView } from "../features/result-review/ResultReviewView";
import { SettingsView } from "../features/settings/SettingsView";
import { api, ApiClientError } from "../shared/api/client";
import { ConfirmDialog } from "../shared/components/ConfirmDialog";
import type {
  ArrangePreset,
  JsonObject,
  JsonValue,
  LLMJob,
  MatrixPlan,
  MatrixVariant,
  PromptDocument,
  PromptParameters,
  PromptPatch,
  PromptWorkshopResult,
  ReferenceAsset,
  ResultImage,
  ResultReview,
  RuntimeSettingsPublic,
  WorkspaceResponse
} from "../shared/types/api";
import { copyText, downloadText } from "../shared/utils/clipboard";
import { displayAgentName, displayFieldName, displayPatch, displayValue } from "../shared/utils/user-facing";
import "./styles.css";

type TabId =
  | "composer"
  | "free-editor"
  | "matrix-lab"
  | "reference-library"
  | "result-review"
  | "settings";

type PendingConfirm =
  | { kind: "patch"; patch: PromptPatch }
  | { kind: "parameters"; payload: JsonObject }
  | { kind: "delete-reference"; reference: ReferenceAsset }
  | {
      kind: "save-draft-and-continue";
      draft: ComposerPayload;
      navigation: PendingNavigation;
    }
  | {
      kind: "discard-draft-and-continue";
      navigation: Extract<PendingNavigation, { kind: "undo" } | { kind: "redo" }>;
    };

type PendingNavigation =
  | { kind: "new"; name: string }
  | { kind: "project"; projectId: string }
  | { kind: "undo" }
  | { kind: "redo" }
  | { kind: "tab"; tab: TabId };

type AutoSuggestionRequest = Pick<AutoSuggestionState, "revision" | "sourceText">;

type StatusKind = "progress" | "success" | "error" | "neutral";

interface StatusMessage {
  kind: StatusKind;
  message: string;
}

const tabs: { id: TabId; label: string; shortLabel: string; featureName: string; icon: ReactNode }[] = [
  { id: "composer", label: "プロンプトを作る", shortLabel: "作る", featureName: "Composer", icon: <PenLine size={15} /> },
  { id: "free-editor", label: "Prompt Workshop", shortLabel: "Workshop", featureName: "Prompt Workshop", icon: <FilePenLine size={15} /> },
  { id: "reference-library", label: "参考画像を使う", shortLabel: "参考画像", featureName: "Reference Library", icon: <Images size={15} /> },
  { id: "matrix-lab", label: "複数案を比較する", shortLabel: "比較", featureName: "Matrix Lab", icon: <Grid3X3 size={15} /> },
  { id: "result-review", label: "生成結果を見直す", shortLabel: "見直す", featureName: "Result Review", icon: <ScanSearch size={15} /> },
  { id: "settings", label: "設定", shortLabel: "設定", featureName: "Settings", icon: <Settings size={15} /> }
];

const workflowTabs = tabs.filter((tab) => tab.id !== "settings");

const tabId = (tab: TabId): string => `main-tab-${tab}`;

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [document, setDocument] = useState<PromptDocument | null>(null);
  const [parameters, setParameters] = useState<PromptParameters | null>(null);
  const [references, setReferences] = useState<ReferenceAsset[]>([]);
  const [resultImages, setResultImages] = useState<ResultImage[]>([]);
  const [jobs, setJobs] = useState<LLMJob[]>([]);
  const [settings, setSettings] = useState<RuntimeSettingsPublic | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("composer");
  const [showInspectorOutsideComposer, setShowInspectorOutsideComposer] = useState(false);
  const [agentResult, setAgentResult] = useState<JsonObject | null>(null);
  const [pendingPatches, setPendingPatches] = useState<PromptPatch[]>([]);
  const [matrixPlan, setMatrixPlan] = useState<MatrixPlan | null>(null);
  const [matrixVariants, setMatrixVariants] = useState<MatrixVariant[]>([]);
  const [reviewsByResultId, setReviewsByResultId] = useState<Record<string, ResultReview[]>>({});
  const [comparisonLines, setComparisonLines] = useState<string[]>([]);
  const [auditResult, setAuditResult] = useState<JsonObject | null>(null);
  const [freeEditorResult, setFreeEditorResult] = useState({ result: "", detail: "" });
  const [workshopResults, setWorkshopResults] = useState<
    Record<string, PromptWorkshopResult | undefined>
  >({});
  const [arrangePresets, setArrangePresets] = useState<ArrangePreset[]>([]);
  const [arrangePresetWarning, setArrangePresetWarning] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [status, setStatus] = useState<StatusMessage | string>({
    kind: "progress",
    message: "起動しています。ローカルデータを読み込んでいます。"
  });
  const [bootState, setBootState] = useState<"loading" | "ready" | "failed">("loading");
  const [bootSettingsCheck, setBootSettingsCheck] = useState<StatusMessage | null>(null);
  const [manualCopy, setManualCopy] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<ComposerPayload | null>(null);
  const [autoSuggestion, setAutoSuggestion] = useState<AutoSuggestionState | null>(null);
  const manualCopyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const handledJobs = useRef<Set<string>>(new Set());
  const latestAutoSuggestionRevision = useRef<number | null>(null);
  const autoSuggestionRequests = useRef<Map<string, AutoSuggestionRequest>>(new Map());

  const loadWorkspace = useCallback(async () => {
    const next = await api.workspace();
    setWorkspace(next);
    setDocument(next.document);
    setParameters(next.document.parameters);
    setReferences(next.references);
    setResultImages(next.result_images);
    setSettings(next.settings);
    setJobs(next.jobs);
    next.jobs
      .filter((job) => ["succeeded", "failed", "cancelled"].includes(job.status))
      .forEach((job) => handledJobs.current.add(job.id));
    setBootState("ready");
    setStatus({ kind: "success", message: "準備ができました。" });
  }, []);

  const retryWorkspace = useCallback(() => {
    setBootState("loading");
    setBootSettingsCheck(null);
    setStatus({ kind: "progress", message: "再接続しています。ローカルデータを読み込んでいます。" });
    loadWorkspace().catch((error: unknown) => {
      setBootState("failed");
      setStatus(errorToMessage(error));
    });
  }, [loadWorkspace]);

  useEffect(() => {
    retryWorkspace();
  }, [retryWorkspace]);

  useEffect(() => {
    api
      .promptArrangePresets()
      .then((response) => {
        setArrangePresets(response.presets);
        setArrangePresetWarning(response.warning);
      })
      .catch(() => {
        setArrangePresetWarning("アレンジプリセットを読み込めませんでした。再試行してください。");
      });
  }, []);

  const savePayload = useCallback(
    (payload: ComposerPayload): ComposerPayload => ({
      ...payload,
      parameters: parameters ?? payload.parameters
    }),
    [parameters]
  );

  const updateDocument = useCallback((next: PromptDocument) => {
    setDocument(next);
    setParameters(next.parameters);
    setComposerDraft(null);
    setWorkspace((current) => (current ? { ...current, document: next } : current));
  }, []);

  const handleJobCompletion = useCallback((job: LLMJob) => {
    const output = job.output_json;
    if (!output) {
      return;
    }
    if (job.agent_name === "IntentIntakeAgent") {
      setAgentResult(output);
      const nextDocument = readObject(output.document);
      if (nextDocument) {
        updateDocument(nextDocument as unknown as PromptDocument);
      }
      const agent = readObject(output.agent);
      if (agent) {
        setAgentResult(agent);
      }
      loadWorkspace().catch(() => undefined);
      return;
    }
    if (job.agent_name === "VocabularyAgent") {
      if (output.target === "free_editor") {
        setAgentResult(output);
        setFreeEditorResult({
          result: String(output.transformed ?? ""),
          detail: String(output.detail ?? "")
        });
        return;
      }
      if (output.target === "auto_suggestion") {
        const request = autoSuggestionRequests.current.get(job.id);
        if (
          !request ||
          request.revision !== latestAutoSuggestionRevision.current ||
          String(output.source_text ?? "") !== request.sourceText
        ) {
          return;
        }
        setAgentResult(output);
        setAutoSuggestion({ ...request, status: "succeeded" });
        setPendingPatches(readPatches(output.patches));
        return;
      }
      setAgentResult(output);
      setPendingPatches(readPatches(output.patches));
      return;
    }
    if (
      job.agent_name === "PromptGeneratorAgent" ||
      job.agent_name === "PromptTransformAgent" ||
      job.agent_name === "PromptLengthAdjustAgent" ||
      job.agent_name === "PromptArrangeAgent"
    ) {
      const operation = String(output.operation ?? "");
      if (operation) {
        setWorkshopResults((current) => ({
          ...current,
          [operation]: output as unknown as PromptWorkshopResult
        }));
      }
      setAgentResult(output);
      return;
    }
    if (job.agent_name === "PromptDoctorAgent") {
      setAgentResult(output);
      setPendingPatches(readPatches(output.patches));
      return;
    }
    if (job.agent_name === "ParameterAdvisorAgent") {
      setAgentResult(output);
      setPendingConfirm({ kind: "parameters", payload: output });
      return;
    }
    if (job.agent_name === "MatrixPlannerAgent") {
      setAgentResult(output);
      const plan = readObject(output.plan);
      if (plan) {
        setMatrixPlan(plan as unknown as MatrixPlan);
      }
      return;
    }
    if (job.agent_name === "ResultReviewAgent") {
      setAgentResult(output);
      const review = readObject(output.review);
      if (review) {
        const resultReview = review as unknown as ResultReview;
        setReviewsByResultId((current) => ({
          ...current,
          [resultReview.result_image_id]: [
            resultReview,
            ...(current[resultReview.result_image_id] ?? []).filter(
              (item) => item.id !== resultReview.id
            )
          ]
        }));
      }
      loadWorkspace().catch(() => undefined);
      return;
    }
    if (job.agent_name === "FinalAuditorAgent") {
      setAgentResult(output);
      setAuditResult(output);
      return;
    }
    if (job.agent_name === "ReferenceAnalyzerAgent") {
      setAgentResult(output);
      loadWorkspace().catch(() => undefined);
    }
  }, [loadWorkspace, updateDocument]);

  const refreshJobs = useCallback(async () => {
    const response = await api.jobs();
    setJobs(response.jobs);
    response.jobs.forEach((job) => {
      const autoSuggestionRequest = autoSuggestionRequests.current.get(job.id);
      if (
        autoSuggestionRequest &&
        autoSuggestionRequest.revision === latestAutoSuggestionRevision.current &&
        (job.status === "queued" || job.status === "running")
      ) {
        setAutoSuggestion({ ...autoSuggestionRequest, status: job.status });
      }
      if (job.status === "succeeded" && !handledJobs.current.has(job.id)) {
        handledJobs.current.add(job.id);
        handleJobCompletion(job);
        setStatus({
          kind: "success",
          message: `${displayAgentName(job.agent_name)}が完了しました。結果は対象画面で確認できます。`
        });
      }
      if (job.status === "failed" && !handledJobs.current.has(job.id)) {
        handledJobs.current.add(job.id);
        if (
          autoSuggestionRequest &&
          autoSuggestionRequest.revision === latestAutoSuggestionRevision.current
        ) {
          setAutoSuggestion({ ...autoSuggestionRequest, status: "failed" });
        }
        setStatus(jobFailureStatus(job.agent_name));
      }
      if (job.status === "cancelled" && !handledJobs.current.has(job.id)) {
        handledJobs.current.add(job.id);
        setStatus({
          kind: "neutral",
          message: `${displayAgentName(job.agent_name)}を取り消しました。結果は適用されていません。必要なら元の操作をもう一度実行してください。`
        });
      }
    });
  }, [handleJobCompletion]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshJobs().catch((error: unknown) => setStatus(errorToMessage(error)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [refreshJobs]);

  const submitJob = useCallback(async (work: () => Promise<{ job: LLMJob }>, message: string) => {
    try {
      const response = await work();
      setJobs((current) => [response.job, ...current.filter((job) => job.id !== response.job.id)]);
      setStatus({ kind: "progress", message });
    } catch (error) {
      setStatus(errorToMessage(error));
    }
  }, []);

  const loadResultReviews = useCallback((resultImageId: string) => {
    api
      .resultReviews(resultImageId)
      .then((response) =>
        setReviewsByResultId((current) => {
          const existingReviews = current[resultImageId] ?? [];
          // A request started before a completed review is persisted can return an empty list.
          // Keep the completion payload already shown to the user until a non-empty refresh arrives.
          if (response.reviews.length === 0 && existingReviews.length > 0) {
            return current;
          }
          return { ...current, [resultImageId]: response.reviews };
        })
      )
      .catch((error: unknown) => setStatus(errorToMessage(error)));
  }, []);

  const requestAutoSuggestion = useCallback((sourceText: string, revision: number) => {
    const request = { sourceText, revision };
    latestAutoSuggestionRevision.current = revision;
    setAutoSuggestion({ ...request, status: "queued" });

    api
      .vocabulary({ text: sourceText, mode: "auto", source_text: sourceText })
      .then((response) => {
        autoSuggestionRequests.current.set(response.job.id, request);
        setJobs((current) => [response.job, ...current.filter((job) => job.id !== response.job.id)]);
        if (latestAutoSuggestionRevision.current === revision) {
          setStatus({
            kind: "progress",
            message: "AI補助へ送信しました。提案は確認してから適用できます。"
          });
        }
      })
      .catch((error: unknown) => {
        if (latestAutoSuggestionRevision.current === revision) {
          setAutoSuggestion({ ...request, status: "failed" });
          setStatus(errorToMessage(error));
        }
      });
  }, []);

  const currentDocument = document;
  const currentSettings = settings;
  const isComposerDirty = isDraftDirty(composerDraft, currentDocument);

  const updateDraftParameters = useCallback(
    (next: PromptParameters) => {
      setParameters(next);
      setComposerDraft((current) => {
        if (current) {
          return { ...current, parameters: next };
        }
        if (!document) {
          return null;
        }
        return {
          user_brief: document.user_brief,
          blocks: document.blocks,
          parameters: next,
          notes: document.notes,
          tags: document.tags
        };
      });
    },
    [document]
  );

  const executeNavigation = useCallback(
    (navigation: PendingNavigation) => {
      if (!document || !workspace) {
        return;
      }
      if (navigation.kind === "tab") {
        setActiveTab(navigation.tab);
        return;
      }
      if (navigation.kind === "project") {
        api
          .openProject(navigation.projectId)
          .then(() => loadWorkspace())
          .then(() => setComposerDraft(null))
          .catch((error: unknown) => setStatus(errorToMessage(error)));
        return;
      }
      if (navigation.kind === "new") {
        api
          .createProject(navigation.name, "Untitled Prompt")
          .then((response) => {
            setWorkspace({ ...workspace, project: response.project, document: response.document });
            updateDocument(response.document);
            setReferences([]);
            setResultImages([]);
            setComposerDraft(null);
            setStatus("新しいプロジェクトを作成しました。Composerで制作意図を入力できます。");
          })
          .catch((error: unknown) => setStatus(errorToMessage(error)));
        return;
      }
      const historyRequest = navigation.kind === "undo" ? api.undo(document.id) : api.redo(document.id);
      historyRequest
        .then((response) => {
          updateDocument(response.document);
          setComposerDraft(null);
          setStatus(navigation.kind === "undo" ? "直前の保存済み変更を戻しました。" : "戻した変更を再適用しました。");
        })
        .catch((error: unknown) => setStatus(errorToMessage(error)));
    },
    [document, loadWorkspace, updateDocument, workspace]
  );

  const requestNavigation = useCallback(
    (navigation: PendingNavigation) => {
      if (isComposerDirty && composerDraft) {
        if (navigation.kind === "undo" || navigation.kind === "redo") {
          setPendingConfirm({ kind: "discard-draft-and-continue", navigation });
          return;
        }
        setPendingConfirm({ kind: "save-draft-and-continue", draft: composerDraft, navigation });
        return;
      }
      executeNavigation(navigation);
    },
    [composerDraft, executeNavigation, isComposerDirty]
  );

  const content = useMemo(() => {
    if (!workspace || !currentDocument || !currentSettings || !parameters) {
      return <main className="workspace-pane">Loading</main>;
    }
    if (activeTab === "composer") {
      return (
        <ComposerView
          document={{ ...currentDocument, parameters }}
          draft={composerDraft}
          isDirty={isComposerDirty}
          onDraftChange={setComposerDraft}
          onSave={(payload) =>
            api
              .saveBlocks(currentDocument.id, savePayload(payload))
              .then((response) => {
                updateDocument(response.document);
                setComposerDraft(null);
                setStatus("Composerの入力内容を保存しました。");
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onCompile={(payload) =>
            api
              .compile(currentDocument.id, savePayload(payload))
              .then((response) => {
                updateDocument(response.document);
                setStatus("Promptを作成しました。コピーして画像生成サービスへ手動で貼り付け、生成後は「生成結果を見直す」で画像を確認できます。");
                return api.compileReview(response.document.id);
              })
              .then((response) => {
                setJobs((current) => [response.job, ...current]);
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onBrief={(brief) =>
            submitJob(
              () => api.intentIntake(currentDocument.id, brief),
              "AI Brief job を作成しました"
            )
          }
          onFieldAssist={(mode, field, text) =>
            submitJob(
              () => api.vocabulary({ text, mode, field_name: field }),
              "Field assist job を作成しました"
            )
          }
          onAutoSuggest={requestAutoSuggestion}
          autoSuggestion={autoSuggestion}
          onCopyPrompt={() => handleCopy(currentDocument.compiled_prompt, "Compiled Prompt をコピーしました")}
        />
      );
    }
    if (activeTab === "free-editor") {
      const workshopBusy = jobs.some(
        (job) =>
          [
            "PromptGeneratorAgent",
            "PromptTransformAgent",
            "PromptLengthAdjustAgent",
            "PromptArrangeAgent"
          ].includes(job.agent_name) && (job.status === "queued" || job.status === "running")
      );
      return (
        <FreeEditorView
          result={freeEditorResult.result}
          detail={freeEditorResult.detail}
          workshopResults={workshopResults}
          presets={arrangePresets}
          presetWarning={arrangePresetWarning}
          isBusy={workshopBusy}
          onTransform={(mode, source, prompt) =>
            submitJob(
              () =>
                api.vocabulary({
                  text: source || prompt,
                  mode: "free_editor",
                  field_name: mode
                }),
              "Prompt Workshop job を作成しました"
            )
          }
          onGenerate={(payload) =>
            submitJob(
              () =>
                api.promptGenerator({
                  count: payload.count,
                  chaos_level: payload.chaosLevel,
                  output_language: payload.outputLanguage,
                  guidance: payload.guidance,
                  deduplicate: payload.deduplicate
                }),
              "Prompt Generator job を作成しました"
            )
          }
          onPromptTransform={(payload) =>
            submitJob(
              () =>
                api.promptTransform({
                  mode: payload.mode,
                  source_prompt: payload.sourcePrompt,
                  output_language: payload.outputLanguage,
                  max_characters: payload.maxCharacters,
                  additional_guidance: payload.additionalGuidance
                }),
              "Prompt Transform job を作成しました"
            )
          }
          onLengthAdjust={(payload) =>
            submitJob(
              () =>
                api.promptLengthAdjust({
                  source_prompt: payload.sourcePrompt,
                  length_ratio: payload.lengthRatio,
                  max_characters: payload.maxCharacters
                }),
              "文字数調整 job を作成しました"
            )
          }
          onArrange={(payload) =>
            submitJob(
              () =>
                api.promptArrange({
                  source_prompt: payload.sourcePrompt,
                  preset_id: payload.presetId,
                  strength: payload.strength,
                  additional_guidance: payload.additionalGuidance,
                  length_ratio: payload.lengthRatio,
                  max_characters: payload.maxCharacters,
                  output_language: payload.outputLanguage
                }),
              "LLMアレンジ job を作成しました"
            )
          }
          onCopy={(text, message) => {
            void handleCopy(text, message);
          }}
          onUseInComposer={(text) =>
            setPendingConfirm({
              kind: "patch",
              patch: {
                field_path: "blocks.notes",
                old_value: currentDocument.blocks.notes,
                new_value: text,
                reason: "Prompt Workshopの結果をComposerへ取り込む",
                confidence: 1,
                requires_user_confirmation: true
              }
            })
          }
        />
      );
    }
    if (activeTab === "matrix-lab") {
      return (
        <MatrixLabView
          plan={matrixPlan}
          variants={matrixVariants}
          onPlan={(objective) =>
            submitJob(() => api.matrixPlan(objective), "Matrix plan job を作成しました")
          }
          onGenerate={() => {
            if (!matrixPlan) {
              setStatus({ kind: "neutral", message: "先にAI Planを作成してください。計画をもとにvariantを生成します。" });
              return;
            }
            api
              .matrixGenerate(workspace.project.id, matrixPlan, currentDocument.compiled_prompt)
              .then((response) => {
                setMatrixVariants(response.variants);
                setStatus(`${response.variants.length}件の比較用variantを生成しました。選択してコピーまたは出力できます。`);
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)));
          }}
          onCopySelected={(variant) =>
            variant
              ? handleCopy(variant.prompt, `Variant ${variant.index} をコピーしました`)
              : setStatus({ kind: "neutral", message: "コピーするvariantを1件選択してください。" })
          }
          onCopyAll={() =>
            handleCopy(
              matrixVariants.map((variant) => variant.prompt).join("\n"),
              `${matrixVariants.length}件のMatrix variant をコピーしました`
            )
          }
          onExportCsv={() =>
            api
              .matrixCsv(matrixVariants)
              .then((csv) => {
                downloadText("matrix_variants.csv", csv, "text/csv");
                return handleCopy(csv, "Matrix variants CSV をダウンロードしてコピーしました");
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onExportMarkdown={() => {
            if (!matrixPlan) {
              setStatus({ kind: "neutral", message: "Matrix Markdownを出力するには、先にAI Planを作成してください。" });
              return;
            }
            api
              .matrixMarkdown(matrixPlan, matrixVariants)
              .then((markdown) => {
                downloadText("matrix_variants.md", markdown, "text/markdown");
                return handleCopy(markdown, "Matrix variants Markdown をダウンロードしてコピーしました");
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)));
          }}
        />
      );
    }
    if (activeTab === "reference-library") {
      return (
        <ReferenceLibraryView
          references={references}
          onUpload={(file) =>
            api
              .uploadReference(workspace.project.id, file)
              .then((response) => {
                setReferences((current) => [response.reference, ...current]);
                setStatus("参照素材を取り込みました。内容を確認してタグや分析を追加できます。");
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onAnalyze={(referenceId) =>
            submitJob(
              () => api.referenceAnalyzer(referenceId),
              "Reference analysis job を作成しました"
            )
          }
          onSaveTags={(referenceId, tags) =>
            api
              .updateReferenceTags(referenceId, tags)
              .then((response) => {
                setReferences((current) =>
                  current.map((reference) =>
                    reference.id === referenceId ? response.reference : reference
                  )
                );
                setStatus("参照素材のタグを保存しました。次回もこの素材を探しやすくなります。");
              })
              .catch((error: unknown) => {
                setStatus(errorToMessage(error));
                throw error;
              })
          }
          onDelete={(reference) => setPendingConfirm({ kind: "delete-reference", reference })}
          onVocabularyPatch={(vocabulary) =>
            setPendingConfirm({
              kind: "patch",
              patch: {
                field_path: "blocks.style",
                old_value: currentDocument.blocks.style,
                new_value: [currentDocument.blocks.style, vocabulary].filter(Boolean).join(", "),
                reason: "参照素材から抽出した語彙をStyleへ追加",
                confidence: 0.9,
                requires_user_confirmation: true
              }
            })
          }
        />
      );
    }
    if (activeTab === "result-review") {
      return (
        <ResultReviewView
          resultImages={resultImages}
          reviewsByResultId={reviewsByResultId}
          comparisonLines={comparisonLines}
          auditResult={auditResult}
          onUpload={(file) =>
            api
              .uploadResult(currentDocument.id, file)
              .then((response) => {
                setResultImages((current) => [response.result_image, ...current]);
                setStatus("生成結果画像を取り込みました。Result Reviewで確認できます。");
              })
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onReview={(resultImageId) =>
            submitJob(() => api.resultReview(resultImageId), "Result review job を作成しました")
          }
          onSelectResult={loadResultReviews}
          onCompare={() =>
            api
              .compareResults(workspace.project.id)
              .then((response) => setComparisonLines(response.lines))
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onNextPrompt={(candidate) =>
            setPendingConfirm({
              kind: "patch",
              patch: {
                field_path: "blocks.notes",
                old_value: currentDocument.blocks.notes,
                new_value: candidate,
                reason: "Result Reviewの改善候補をComposerへ戻す",
                confidence: 0.82,
                requires_user_confirmation: true
              }
            })
          }
          onFinalAudit={() =>
            submitJob(() => api.finalAudit(currentDocument.id), "Final audit job を作成しました")
          }
        />
      );
    }
    return (
      <SettingsView
        settings={currentSettings}
        onSessionKey={async (apiKey) => {
          try {
            const response = await api.setSessionApiKey(apiKey);
            setSettings(response.settings);
            setStatus("API keyをこのセッションに適用しました。アプリを閉じると削除されます。");
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
        onPersistKey={async (apiKey) => {
          try {
            const response = await api.persistApiKey(apiKey);
            setSettings(response.settings);
            setStatus(response.persisted ? "API keyをOS資格情報ストアに保存しました。" : "OS資格情報ストアを使えないため、このセッションだけでAPI keyを使用します。");
            return { persisted: response.persisted };
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
        onLoadStoredKey={async () => {
          try {
            const response = await api.loadPersistedApiKey();
            setSettings(response.settings);
            setStatus(
              response.loaded
                ? "OS資格情報ストアからAPI keyを読み込み、このセッションに適用しました。キーの値は表示しません。"
                : "保存済みのAPI keyが見つからないか、OS資格情報ストアを利用できません。設定は変更していません。"
            );
            return { loaded: response.loaded };
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
        onResponseStorage={async (mode) => {
          try {
            const response = await api.saveResponseStorage(mode);
            setSettings(response.settings);
            setStatus("Privacy modeの設定を保存しました。以後の実API呼び出しに反映されます。");
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
        onTextOutputOptions={async (includeOptions) => {
          try {
            const response = await api.saveTextOutputOptions(includeOptions);
            setSettings(response.settings);
            const workspaceResponse = await api.workspace();
            updateDocument(workspaceResponse.document);
            setStatus("テキストPrompt出力のオプション設定を保存しました。現在の表示にも反映されています。");
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
        onExclusionTerms={async (terms) => {
          try {
            const response = await api.saveExclusionTerms(terms);
            setSettings(response.settings);
            setStatus("Prompt除外語句を保存しました。次の創作系Prompt生成から反映されます。");
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
        onPreferences={(preferences) =>
          api
            .saveFeaturePreferences(preferences)
            .then((response) => {
              setSettings(response.settings);
              setStatus("AI支援の語彙設定を保存しました。次のAI支援から反映されます。");
            })
            .catch((error: unknown) => setStatus(errorToMessage(error)))
        }
        onConnectionTest={async () => {
          try {
            const response = await api.connectionTest();
            setStatus(
              response.ok
                ? "Connection OK"
                : { kind: "error", message: "実APIへの接続を確認できませんでした。API keyとネットワークを確認して再試行してください。" }
            );
            return response.ok;
          } catch (error) {
            setStatus(errorToMessage(error));
            throw error;
          }
        }}
      />
    );
  }, [
    activeTab,
    autoSuggestion,
    auditResult,
    comparisonLines,
    composerDraft,
    currentDocument,
    currentSettings,
    freeEditorResult,
    jobs,
    reviewsByResultId,
    loadWorkspace,
    matrixPlan,
    matrixVariants,
    parameters,
    isComposerDirty,
    loadResultReviews,
    references,
    requestAutoSuggestion,
    resultImages,
    savePayload,
    submitJob,
    updateDraftParameters,
    workshopResults,
    arrangePresets,
    arrangePresetWarning,
    workspace
  ]);

  const statusMessage = toStatusMessage(status);

  if (bootState === "failed") {
    return (
      <main className="boot-screen boot-recovery" aria-labelledby="boot-error-title">
        <section>
          <p className="eyebrow">MJ Prompt Studio</p>
          <h1 id="boot-error-title">起動できませんでした</h1>
          <p className="boot-error" role="alert">
            {statusMessage.message}
          </p>
          <p>プロジェクトと保存済みの内容はまだ読み込まれていません。</p>
          <div className="boot-actions">
            <button type="button" onClick={retryWorkspace}>
              再試行する
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                api
                  .settings()
                  .then(() =>
                    setBootSettingsCheck({
                      kind: "success",
                      message: "ローカルAPIへの接続を確認しました。再試行するとプロジェクトを読み込みます。"
                    })
                  )
                  .catch((error: unknown) => setBootSettingsCheck(errorToMessage(error)))
              }
            >
              接続設定を確認する
            </button>
          </div>
          {bootSettingsCheck && (
            <p className={`boot-check is-${bootSettingsCheck.kind}`} role="status" aria-live="polite">
              {bootSettingsCheck.message}
            </p>
          )}
        </section>
      </main>
    );
  }

  if (!workspace || !document || !settings || !parameters) {
    return (
      <main className="boot-screen" role="status" aria-live="polite">
        <strong>MJ Prompt Studio</strong>
        <span>起動しています。ローカルデータを読み込んでいます。</span>
      </main>
    );
  }

  const confirmContent = renderConfirmContent(pendingConfirm);
  const confirmDialogDetails = getConfirmDialogDetails(pendingConfirm);
  const inspectorVisible = activeTab === "composer" || showInspectorOutsideComposer;

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, currentTab: TabId): void => {
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTab);
    const targetIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : -1;
    if (targetIndex === -1) {
      return;
    }
    event.preventDefault();
    const target = tabs[targetIndex];
    globalThis.document.getElementById(tabId(target.id))?.focus();
    requestNavigation({ kind: "tab", tab: target.id });
  };

  return (
    <div className={`app-shell ${inspectorVisible ? "" : "inspector-hidden"}`}>
      <header className="app-header">
        <div>
          <strong>MJ Prompt Studio</strong>
          <span>{workspace.project.name}</span>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              const name = window.prompt("Project name", "New Prompt Project");
              if (name) {
                requestNavigation({ kind: "new", name });
              }
            }}
          >
            <Plus size={16} /> New
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => requestNavigation({ kind: "undo" })}
          >
            <Undo2 size={16} /> Undo
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => requestNavigation({ kind: "redo" })}
          >
            <RotateCcw size={16} /> Redo
          </button>
          <button
            type="button"
            onClick={() =>
              api
                .exportFile(document.id, "markdown_record", matrixPlan ?? undefined, matrixVariants)
                .then((content) => {
                  downloadText(`${document.title}.md`, content, "text/markdown");
                  setStatus("制作記録をMarkdownで出力しました。ダウンロードしたファイルを確認できます。");
                })
                .catch((error: unknown) => setStatus(errorToMessage(error)))
            }
          >
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <aside className="left-panel">
        <section>
          <h2>Projects</h2>
          {workspace.projects.map((project) => (
            <button
              type="button"
              className={`nav-row ${project.id === workspace.project.id ? "active" : ""}`}
              key={project.id}
              aria-current={project.id === workspace.project.id ? "page" : undefined}
              aria-label={
                project.id === workspace.project.id ? `${project.name}（現在のProject）` : project.name
              }
              onClick={() => requestNavigation({ kind: "project", projectId: project.id })}
            >
              <FolderOpen size={15} /> <span>{project.name}</span>
              {project.id === workspace.project.id && <span className="nav-current" aria-hidden="true">現在</span>}
            </button>
          ))}
        </section>
        <section>
          <h2>制作の流れ</h2>
          <p className="scope-note">必要な画面だけを順に使えます。</p>
          {workflowTabs.map((tab, index) => (
            <button
              type="button"
              className={`nav-row ${activeTab === tab.id ? "active" : ""}`}
              key={tab.id}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => requestNavigation({ kind: "tab", tab: tab.id })}
            >
              {tab.icon} <span>{index + 1}. {tab.label}</span>
              {activeTab === tab.id && <span className="nav-current" aria-hidden="true">現在</span>}
            </button>
          ))}
        </section>
      </aside>

      <nav className="tab-bar" aria-label="Main tabs">
        <div role="tablist" aria-label="Main tabs" className="tab-list">
          {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            id={tabId(tab.id)}
            role="tab"
            aria-label={`${tab.label} ${tab.featureName}`}
            aria-controls="main-workspace"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={activeTab === tab.id ? "active" : ""}
            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            onClick={() => requestNavigation({ kind: "tab", tab: tab.id })}
          >
            {tab.icon}
            <span>{tab.shortLabel}</span>
            {activeTab === tab.id && <span className="tab-current" aria-hidden="true">現在</span>}
          </button>
          ))}
        </div>
        {activeTab !== "composer" && (
          <button
            type="button"
            className="inspector-toggle"
            aria-pressed={showInspectorOutsideComposer}
            onClick={() => setShowInspectorOutsideComposer((current) => !current)}
          >
            {showInspectorOutsideComposer ? "AIの状況を隠す" : "AIの状況を表示"}
          </button>
        )}
      </nav>

      <main id="main-workspace" className="main-panel" role="tabpanel" aria-labelledby={tabId(activeTab)}>
        {content}
      </main>

      {inspectorVisible && (
        <aside className="right-panel">
          <AIInspector document={document} agentResult={agentResult} executionProfile={settings} />
          <ParameterInspector
            specs={settings.ruleset.parameters}
            parameters={parameters}
            onChange={updateDraftParameters}
            onAdvice={() =>
              submitJob(
                () => api.parameterAdvisor(document.id, document.user_brief || document.compiled_prompt),
                "Parameter advisor job を作成しました"
              )
            }
          />
          <PromptDoctorPanel
            validationReport={document.validation_report}
            patches={pendingPatches}
            onRun={() =>
              submitJob(() => api.promptDoctor(document.id), "Prompt Doctor job を作成しました")
            }
            onApplyPatch={(patch) => setPendingConfirm({ kind: "patch", patch })}
          />
        </aside>
      )}

      <footer className="bottom-panel">
        <p className={`app-status is-${statusMessage.kind}`} role="status" aria-live="polite">
          {statusMessage.message}
        </p>
        <JobsPanel
          jobs={jobs}
          onRefresh={() => refreshJobs().catch((error: unknown) => setStatus(errorToMessage(error)))}
          onCancel={(jobId) =>
            api
              .cancelJob(jobId)
              .then(() => refreshJobs())
              .catch((error: unknown) => setStatus(errorToMessage(error)))
          }
          onRetry={(jobId) => {
            handledJobs.current.delete(jobId);
            api
              .retryJob(jobId)
              .then(() => refreshJobs())
              .catch((error: unknown) => setStatus(errorToMessage(error)));
          }}
        />
      </footer>

      <ConfirmDialog
        open={pendingConfirm !== null}
        title={confirmDialogDetails.title}
        description={confirmDialogDetails.description}
        confirmLabel={confirmDialogDetails.confirmLabel}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (!pendingConfirm) {
            return;
          }
          applyConfirmed(pendingConfirm);
        }}
      >
        {confirmContent}
      </ConfirmDialog>
      <ConfirmDialog
        open={manualCopy !== null}
        title="手動でコピー"
        description="コピーが自動でできなかったため、表示されたテキストを選択してコピーしてください。閉じても内容は変更されません。"
        confirmLabel="閉じる"
        initialFocusRef={manualCopyTextareaRef}
        onConfirm={() => setManualCopy(null)}
        onCancel={() => setManualCopy(null)}
      >
        <textarea ref={manualCopyTextareaRef} value={manualCopy ?? ""} readOnly rows={8} />
      </ConfirmDialog>
      <HelpWidget context={activeTab} />
    </div>
  );

  function handleCopy(text: string, successMessage = "コピーしました"): void {
    copyText(text).then((ok) => {
      if (ok) {
        setStatus(successMessage);
      } else {
        setManualCopy(text);
      }
    });
  }

  function applyConfirmed(confirm: PendingConfirm): void {
    if (!document || !parameters) {
      return;
    }
    if (confirm.kind === "save-draft-and-continue") {
      api
        .saveBlocks(document.id, savePayload(confirm.draft))
        .then((response) => {
          updateDocument(response.document);
          setComposerDraft(null);
          setPendingConfirm(null);
          setStatus("Composerの入力内容を保存しました。続けて操作します。");
          executeNavigation(confirm.navigation);
        })
        .catch((error: unknown) => setStatus(errorToMessage(error)));
      return;
    }
    if (confirm.kind === "discard-draft-and-continue") {
      const historyRequest =
        confirm.navigation.kind === "undo" ? api.undo(document.id) : api.redo(document.id);
      historyRequest
        .then((response) => {
          updateDocument(response.document);
          setPendingConfirm(null);
          setStatus(confirm.navigation.kind === "undo" ? "直前の保存済み変更を戻しました。" : "戻した変更を再適用しました。");
        })
        .catch((error: unknown) => setStatus(errorToMessage(error)));
      return;
    }
    if (confirm.kind === "patch") {
      api
        .applyPatch(document.id, confirm.patch)
        .then((response) => {
          updateDocument(response.document);
          setPendingConfirm(null);
          setStatus(`${displayFieldName(confirm.patch.field_path)}へ提案した変更を適用しました。`);
        })
        .catch((error: unknown) => setStatus(errorToMessage(error)));
      return;
    }
    if (confirm.kind === "parameters") {
      const merged = mergeParameters(parameters, readObject(confirm.payload.parameters) ?? {});
      api
        .compile(document.id, {
          user_brief: document.user_brief,
          blocks: document.blocks,
          parameters: merged,
          notes: document.notes,
          tags: document.tags
        })
        .then((response) => {
          updateDocument(response.document);
          setPendingConfirm(null);
          setStatus("提案されたパラメータを適用し、Compiled Promptを更新しました。内容を確認できます。");
        })
        .catch((error: unknown) => setStatus(errorToMessage(error)));
      return;
    }
    api
      .deleteReference(confirm.reference.id)
      .then(() => {
        setReferences((current) =>
          current.filter((reference) => reference.id !== confirm.reference.id)
        );
        setPendingConfirm(null);
        setStatus("参照素材を削除しました。この操作は取り消せません。");
      })
      .catch((error: unknown) => setStatus(errorToMessage(error)));
  }
}

function renderConfirmContent(confirm: PendingConfirm | null): ReactNode {
  if (!confirm) {
    return null;
  }
  if (confirm.kind === "patch") {
    const patch = displayPatch(confirm.patch);
    return (
      <dl className="confirm-grid">
        <div>
          <dt>提案の理由</dt>
          <dd>{confirm.patch.reason}</dd>
        </div>
        <div>
          <dt>変更する項目</dt>
          <dd>{patch.field}</dd>
        </div>
        <div>
          <dt>現在の内容</dt>
          <dd>{patch.oldValue}</dd>
        </div>
        <div>
          <dt>提案する内容</dt>
          <dd>{patch.newValue}</dd>
        </div>
        <div>
          <dt>提案の確からしさ</dt>
          <dd>{Math.round(confirm.patch.confidence * 100)}%</dd>
        </div>
      </dl>
    );
  }
  if (confirm.kind === "parameters") {
    const proposedParameters = readObject(confirm.payload.parameters) ?? {};
    return (
      <dl className="confirm-grid">
        {Object.entries(proposedParameters).map(([name, value]) => (
          <div key={name}>
            <dt>{displayFieldName(name)}</dt>
            <dd>{displayValue(value)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  if (confirm.kind === "save-draft-and-continue") {
    return <p>未保存のComposerとパラメータ編集を保存してから、選択した操作を続けます。キャンセルすると編集内容を保持します。</p>;
  }
  if (confirm.kind === "discard-draft-and-continue") {
    const action = confirm.navigation.kind === "undo" ? "Undo" : "Redo";
    return <p>保存せずに未保存のComposerとパラメータ編集を破棄して、{action}を実行します。キャンセルすると編集内容を保持します。</p>;
  }
  return <p>{confirm.reference.name}</p>;
}

function getConfirmDialogDetails(confirm: PendingConfirm | null): {
  title: string;
  description: string;
  confirmLabel: string;
} {
  if (confirm?.kind === "delete-reference") {
    return {
      title: "参照を削除しますか？",
      description: `「${confirm.reference.name}」を削除します。この操作は取り消せません。`,
      confirmLabel: "削除する"
    };
  }
  if (confirm?.kind === "parameters") {
    return {
      title: "パラメータを適用しますか？",
      description: "提案されたパラメータでPromptを更新します。内容を確認してから適用してください。",
      confirmLabel: "パラメータを適用"
    };
  }
  if (confirm?.kind === "save-draft-and-continue") {
    return {
      title: "未保存の変更を保存しますか？",
      description: "保存してから続行します。保存に失敗した場合はこの画面に留まり、入力内容は保持されます。",
      confirmLabel: "保存して続行"
    };
  }
  if (confirm?.kind === "discard-draft-and-continue") {
    const action = confirm.navigation.kind === "undo" ? "Undo" : "Redo";
    return {
      title: `未保存の変更を破棄して${action}しますか？`,
      description: `保存していない入力を破棄して${action}を実行します。キャンセルすると入力内容は保持されます。`,
      confirmLabel: `破棄して${action}`
    };
  }
  return {
    title: "変更を適用しますか？",
    description: "提案された変更で既存の入力内容を置き換える場合があります。内容を確認してから適用してください。",
    confirmLabel: "変更を適用"
  };
}

function readObject(value: JsonValue | undefined): JsonObject | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value;
  }
  return null;
}

function readPatches(value: JsonValue | undefined): PromptPatch[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const object = readObject(item);
    if (!object) {
      return [];
    }
    return [
      {
        field_path: String(object.field_path ?? ""),
        old_value: object.old_value ?? null,
        new_value: object.new_value ?? null,
        reason: String(object.reason ?? ""),
        confidence: Number(object.confidence ?? 0),
        requires_user_confirmation: Boolean(object.requires_user_confirmation ?? true)
      }
    ];
  });
}

function mergeParameters(base: PromptParameters, patch: JsonObject): PromptParameters {
  const next: PromptParameters = { ...base, custom: { ...base.custom } };
  for (const [key, value] of Object.entries(patch)) {
    if (key in next && key !== "custom") {
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        Object.assign(next, { [key]: value });
      }
    } else {
      next.custom[key] = value;
    }
  }
  return next;
}

function isDraftDirty(draft: ComposerPayload | null, document: PromptDocument | null): boolean {
  if (!draft || !document) {
    return false;
  }
  return (
    draft.user_brief !== document.user_brief ||
    JSON.stringify(draft.blocks) !== JSON.stringify(document.blocks) ||
    JSON.stringify(draft.parameters) !== JSON.stringify(document.parameters) ||
    draft.notes !== document.notes ||
    JSON.stringify(draft.tags) !== JSON.stringify(document.tags)
  );
}

function toStatusMessage(status: StatusMessage | string): StatusMessage {
  return typeof status === "string" ? { kind: "success", message: status } : status;
}

function jobFailureStatus(agentName: string): StatusMessage {
  return {
    kind: "error",
    message: `${displayAgentName(agentName)}を完了できませんでした。結果は適用されていません。入力や接続設定を確認して、再試行してください。`
  };
}

function errorToMessage(error: unknown): StatusMessage {
  const clientError = isApiClientError(error) ? error : null;
  if (clientError?.kind === "network") {
    return {
      kind: "error",
      message: "ローカルAPIに接続できません。ローカルAPIが起動しているか確認してから、再試行してください。"
    };
  }
  if (clientError?.kind === "schema") {
    return {
      kind: "error",
      message: "ローカルAPIから受け取ったデータを確認できません。再試行しても続く場合は接続設定を確認してください。"
    };
  }
  if (clientError?.kind === "http") {
    if (clientError.status === 401 || clientError.status === 403) {
      return {
        kind: "error",
        message: "この操作の認証または設定を確認してください。内容は変更されていません。"
      };
    }
    if (clientError.status === 409) {
      return {
        kind: "error",
        message: "現在の状態では操作を完了できません。画面を更新して内容を確認してから、再試行してください。"
      };
    }
    return {
      kind: "error",
      message: "ローカルAPIがこの処理を完了できませんでした。内容は変更されていません。再試行してください。"
    };
  }
  return {
    kind: "error",
    message: "処理を完了できませんでした。内容は変更されていません。再試行してください。"
  };
}

function isApiClientError(
  error: unknown
): error is Pick<ApiClientError, "kind" | "status"> {
  return (
    error instanceof ApiClientError ||
    (typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      (error.kind === "http" || error.kind === "network" || error.kind === "schema"))
  );
}

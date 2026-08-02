import quickStartMarkdown from "../../../../docs/quick-start.md?raw";
import userManualMarkdown from "../../../../docs/user-manual.md?raw";

export type HelpDocumentId = "quick-start" | "user-manual";
export type HelpContext =
  | "composer"
  | "free-editor"
  | "matrix-lab"
  | "reference-library"
  | "result-review"
  | "settings";

export interface HelpDocument {
  id: HelpDocumentId;
  title: string;
  description: string;
  markdown: string;
}

export interface HelpHeading {
  id: string;
  level: number;
  text: string;
}

export const helpDocuments: HelpDocument[] = [
  {
    id: "quick-start",
    title: "最初に試す流れ",
    description: "初めて使うときの最短手順",
    markdown: quickStartMarkdown
  },
  {
    id: "user-manual",
    title: "ユーザーマニュアル",
    description: "画面ごとの目的と詳しい操作",
    markdown: userManualMarkdown
  }
];

const contextTargets: Record<HelpContext, { documentId: HelpDocumentId; heading: string }> = {
  composer: { documentId: "quick-start", heading: "2. 最初のプロンプトを作る" },
  "free-editor": { documentId: "user-manual", heading: "Free Editor" },
  "matrix-lab": { documentId: "user-manual", heading: "Matrix Lab" },
  "reference-library": { documentId: "user-manual", heading: "Reference Library" },
  "result-review": { documentId: "user-manual", heading: "Result Review" },
  settings: { documentId: "quick-start", heading: "1. AI接続を確認する" }
};

export function helpTargetFor(context: HelpContext): { documentId: HelpDocumentId; heading: string } {
  return contextTargets[context];
}

export function headingsFromMarkdown(markdown: string): HelpHeading[] {
  const occurrence = new Map<string, number>();
  return markdown
    .split("\n")
    .flatMap((line) => {
      const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
      if (!match) {
        return [];
      }
      const text = match[2];
      const baseId = slugifyHeading(text);
      const count = occurrence.get(baseId) ?? 0;
      occurrence.set(baseId, count + 1);
      return [{ id: count === 0 ? baseId : `${baseId}-${count + 1}`, level: match[1].length, text }];
    });
}

export function headingIdFor(markdown: string, heading: string): string | null {
  return headingsFromMarkdown(markdown).find((item) => item.text === heading)?.id ?? null;
}

export function slugifyHeading(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "section";
}

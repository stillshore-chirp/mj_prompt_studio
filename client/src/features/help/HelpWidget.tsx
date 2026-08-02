import { BookOpenText, ChevronDown, ChevronUp, List, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  headingIdFor,
  headingsFromMarkdown,
  helpDocuments,
  helpTargetFor,
  slugifyHeading,
  type HelpContext,
  type HelpDocumentId
} from "./helpDocuments";

interface HelpWidgetProps {
  context: HelpContext;
}

export function HelpWidget({ context }: HelpWidgetProps) {
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState<HelpDocumentId>("quick-start");
  const [pendingHeading, setPendingHeading] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const document = helpDocuments.find((item) => item.id === documentId) ?? helpDocuments[0];
  const headings = useMemo(() => headingsFromMarkdown(document.markdown), [document.markdown]);

  const selectDocument = (nextDocumentId: HelpDocumentId) => {
    setDocumentId(nextDocumentId);
    setPendingHeading(null);
  };

  useEffect(() => {
    if (open) {
      titleRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!pendingHeading) {
      return;
    }
    const headingId = headingIdFor(document.markdown, pendingHeading);
    if (headingId) {
      inNextFrame(() => {
        globalThis.document.getElementById(headingId)?.scrollIntoView({ block: "start" });
      });
    }
    setPendingHeading(null);
  }, [document.markdown, pendingHeading]);

  const close = () => {
    setOpen(false);
    inNextFrame(() => triggerRef.current?.focus());
  };

  const openContextualHelp = () => {
    const target = helpTargetFor(context);
    setDocumentId(target.documentId);
    setPendingHeading(target.heading);
    setOpen(true);
  };

  return (
    <aside className={`help-widget ${open ? "is-open" : ""}`} aria-label="使い方">
      {open ? (
        <section className="help-panel" id="help-panel" aria-labelledby="help-panel-title" onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}>
          <header className="help-panel-header">
            <div>
              <p className="eyebrow">いつでも確認できます</p>
              <h2 id="help-panel-title" ref={titleRef} tabIndex={-1}>使い方</h2>
            </div>
            <button type="button" className="icon-button" onClick={close} aria-label="使い方を閉じる">
              <X size={18} />
            </button>
          </header>
          <div className="help-panel-actions">
            <button type="button" onClick={openContextualHelp}>
              <BookOpenText size={16} /> この画面の使い方へ
            </button>
            <span role="status" aria-live="polite">現在: {document.title}</span>
          </div>
          <div className="help-document-tabs" role="tablist" aria-label="ヘルプ文書">
            {helpDocuments.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={item.id === document.id}
                aria-controls={helpDocumentPanelId(item.id)}
                id={helpDocumentTabId(item.id)}
                tabIndex={item.id === document.id ? 0 : -1}
                onClick={() => {
                  selectDocument(item.id);
                }}
                onKeyDown={(event) => {
                  const currentIndex = helpDocuments.findIndex((candidate) => candidate.id === item.id);
                  const nextIndex = nextHelpDocumentIndex(event.key, currentIndex);
                  if (nextIndex === null) {
                    return;
                  }
                  event.preventDefault();
                  const nextDocument = helpDocuments[nextIndex];
                  selectDocument(nextDocument.id);
                  inNextFrame(() => globalThis.document.getElementById(helpDocumentTabId(nextDocument.id))?.focus());
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="help-panel-body">
            <nav className="help-toc" aria-label={`${document.title}の目次`}>
              <p><List size={15} /> 目次</p>
              <ol>
                {headings.map((heading) => (
                  <li key={heading.id} className={`level-${heading.level}`}>
                    <button
                      type="button"
                      onClick={() => globalThis.document.getElementById(heading.id)?.scrollIntoView({ block: "start" })}
                    >
                      {heading.text}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            <article
              className="markdown-preview"
              role="tabpanel"
              id={helpDocumentPanelId(document.id)}
              aria-labelledby={helpDocumentTabId(document.id)}
              aria-label={document.title}
            >
              <MarkdownPreview
                markdown={document.markdown}
                onSelectDocument={selectDocument}
              />
            </article>
          </div>
        </section>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        className="help-trigger"
        aria-expanded={open}
        aria-controls="help-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <BookOpenText size={18} />
        使い方
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </aside>
  );
}

function MarkdownPreview({
  markdown,
  onSelectDocument
}: {
  markdown: string;
  onSelectDocument: (documentId: HelpDocumentId) => void;
}) {
  const headingCounts = new Map<string, number>();
  const lines = markdown.split("\n");
  const content: React.ReactNode[] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    if (!line.trim()) {
      lineIndex += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const baseId = slugifyHeading(text);
      const count = headingCounts.get(baseId) ?? 0;
      headingCounts.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
      const Heading = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      content.push(<Heading id={id} key={`${id}-${lineIndex}`}>{inlineMarkdown(text, onSelectDocument)}</Heading>);
      lineIndex += 1;
      continue;
    }
    if (line.startsWith("```") || line.startsWith("~~~")) {
      const fence = line.slice(0, 3);
      const code: string[] = [];
      lineIndex += 1;
      while (lineIndex < lines.length && !lines[lineIndex].startsWith(fence)) {
        code.push(lines[lineIndex]);
        lineIndex += 1;
      }
      if (lineIndex < lines.length) {
        lineIndex += 1;
      }
      content.push(<pre key={`code-${lineIndex}`}><code>{code.join("\n")}</code></pre>);
      continue;
    }
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (lineIndex < lines.length && /^[-*+]\s+/.test(lines[lineIndex])) {
        items.push(lines[lineIndex].replace(/^[-*+]\s+/, ""));
        lineIndex += 1;
      }
      content.push(<ul key={`ul-${lineIndex}`}>{items.map((item, index) => <li key={index}>{inlineMarkdown(item, onSelectDocument)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (lineIndex < lines.length && /^\d+\.\s+/.test(lines[lineIndex])) {
        items.push(lines[lineIndex].replace(/^\d+\.\s+/, ""));
        lineIndex += 1;
      }
      content.push(<ol key={`ol-${lineIndex}`}>{items.map((item, index) => <li key={index}>{inlineMarkdown(item, onSelectDocument)}</li>)}</ol>);
      continue;
    }
    const paragraph: string[] = [line];
    lineIndex += 1;
    while (
      lineIndex < lines.length &&
      lines[lineIndex].trim() &&
      !/^(#{1,3})\s+|^[-*+]\s+|^\d+\.\s+|^```|^~~~/.test(lines[lineIndex])
    ) {
      paragraph.push(lines[lineIndex]);
      lineIndex += 1;
    }
    content.push(<p key={`p-${lineIndex}`}>{inlineMarkdown(paragraph.join(" "), onSelectDocument)}</p>);
  }
  return <>{content}</>;
}

function inlineMarkdown(
  value: string,
  onSelectDocument: (documentId: HelpDocumentId) => void
): React.ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const linkedDocument = linkedHelpDocument(link[2]);
      if (linkedDocument) {
        return <button type="button" className="markdown-link" key={index} onClick={() => onSelectDocument(linkedDocument)}>{link[1]}</button>;
      }
      return <a key={index} href={link[2]}>{link[1]}</a>;
    }
    return part;
  });
}

function linkedHelpDocument(href: string): HelpDocumentId | null {
  if (href.endsWith("quick-start.md")) {
    return "quick-start";
  }
  if (href.endsWith("user-manual.md")) {
    return "user-manual";
  }
  return null;
}

function helpDocumentTabId(documentId: HelpDocumentId): string {
  return `help-document-tab-${documentId}`;
}

function helpDocumentPanelId(documentId: HelpDocumentId): string {
  return `help-document-panel-${documentId}`;
}

function nextHelpDocumentIndex(key: string, currentIndex: number): number | null {
  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1) % helpDocuments.length;
  }
  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + helpDocuments.length) % helpDocuments.length;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return helpDocuments.length - 1;
  }
  return null;
}

function inNextFrame(callback: () => void): void {
  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(callback);
    return;
  }
  globalThis.setTimeout(callback, 0);
}

import type { ReactNode } from "react";

interface ScreenGuideProps {
  featureName: string;
  step: string;
  title: string;
  description: string;
  whenToUse: string;
  actions?: ReactNode;
}

export function ScreenGuide({
  featureName,
  step,
  title,
  description,
  whenToUse,
  actions
}: ScreenGuideProps) {
  return (
    <div className="section-header screen-guide">
      <div className="screen-guide-copy">
        <p className="eyebrow">{step}</p>
        <h1>
          {title} <span>{featureName}</span>
        </h1>
        <p>{description}</p>
        <p className="scope-note">
          <strong>使う場面:</strong> {whenToUse}
        </p>
      </div>
      {actions ? <div className="toolbar-actions">{actions}</div> : null}
    </div>
  );
}

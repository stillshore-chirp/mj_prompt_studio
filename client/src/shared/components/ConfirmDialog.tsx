import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  open: boolean;
  confirmLabel?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(", ");

export function ConfirmDialog({
  title,
  description,
  open,
  confirmLabel = "変更を適用",
  children,
  initialFocusRef,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocusedElement.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const backdrop = dialogRef.current?.closest(".modal-backdrop");
    const backgroundSiblings = Array.from(backdrop?.parentElement?.children ?? []).filter(
      (element) => element !== backdrop
    );
    const previousBackgroundState = backgroundSiblings.map((element) => ({
      element,
      inert: element.hasAttribute("inert"),
      ariaHidden: element.getAttribute("aria-hidden")
    }));

    backgroundSiblings.forEach((element) => {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    });

    (initialFocusRef?.current ?? cancelButtonRef.current ?? dialogRef.current)?.focus();

    return () => {
      previousBackgroundState.forEach(({ element, inert, ariaHidden }) => {
        if (inert) {
          element.setAttribute("inert", "");
        } else {
          element.removeAttribute("inert");
        }
        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
      });
      if (lastFocusedElement.current?.isConnected) {
        lastFocusedElement.current.focus();
      }
    };
  }, [initialFocusRef, open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
    if (focusableElements.length === 0) {
      event.preventDefault();
      event.currentTarget.focus();
      return;
    }

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && currentIndex <= 0) {
      event.preventDefault();
      lastElement.focus();
      return;
    }
    if (!event.shiftKey && (currentIndex === -1 || currentIndex === focusableElements.length - 1)) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (!open) {
    return null;
  }
  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="modal-description">
          {description}
        </p>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button ref={cancelButtonRef} type="button" className="secondary" onClick={onCancel}>
            キャンセル
          </button>
          <button type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

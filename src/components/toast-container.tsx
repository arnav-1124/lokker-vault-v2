"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { ToastMessage } from "@/types";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  React.useEffect(() => {
    const duration = toast.type === "error" ? 5000 : 3500;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl border shadow-overlay text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-150 ${
        toast.type === "error"
          ? "bg-destructive text-destructive-foreground border-destructive/40"
          : toast.type === "info"
          ? "bg-surface-elevated text-foreground border-border-strong"
          : "bg-surface text-foreground border-border-subtle"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {toast.type === "error" ? (
          <AlertCircle className="size-4 shrink-0 text-destructive-foreground" />
        ) : toast.type === "info" ? (
          <Info className="size-4 shrink-0 text-primary" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        )}
        <span className="leading-snug break-words">{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

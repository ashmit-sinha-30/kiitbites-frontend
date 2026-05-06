"use client";

import React from "react";

export interface AppDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "info" | "error" | "confirm";
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function AppDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  variant = "info",
  onConfirm,
  onCancel,
}: AppDialogProps) {
  if (!open) return null;

  const colorClass =
    variant === "error"
      ? "border-rose-200"
      : variant === "confirm"
        ? "border-amber-200"
        : "border-slate-200";

  const heading =
    title ||
    (variant === "error" ? "Something went wrong" : variant === "confirm" ? "Please confirm" : "Notification");

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl ${colorClass}`}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base font-semibold text-slate-900">{heading}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          {onCancel && (
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              variant === "error"
                ? "bg-rose-600 hover:bg-rose-700"
                : variant === "confirm"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-slate-900 hover:bg-slate-950"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


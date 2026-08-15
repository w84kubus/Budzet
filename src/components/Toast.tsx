"use client";

import { useEffect, useState } from "react";

type ToastData = {
  message: string;
  undoAction?: () => void;
};

let showToastFn: ((data: ToastData) => void) | null = null;

export function showToast(data: ToastData) {
  showToastFn?.(data);
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showToastFn = (data) => {
      setToast(data);
      setVisible(true);
    };
    return () => {
      showToastFn = null;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setToast(null), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!toast) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-5 md:bottom-8">
      <div
        className={`flex items-center gap-3 rounded-full border border-line/50 bg-panel-2 px-5 py-2.5 shadow-lg shadow-black/30 transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <span className="text-caption font-medium text-text">{toast.message}</span>
        {toast.undoAction && (
          <button
            onClick={() => {
              toast.undoAction?.();
              setVisible(false);
            }}
            className="shrink-0 text-caption font-semibold text-brass"
          >
            Cofnij
          </button>
        )}
      </div>
    </div>
  );
}

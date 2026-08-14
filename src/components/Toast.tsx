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
    <div
      className={`fixed inset-x-5 bottom-24 z-50 rounded-xl bg-panel-2 px-4 py-3 shadow-xl transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-text">{toast.message}</span>
        {toast.undoAction && (
          <button
            onClick={() => {
              toast.undoAction?.();
              setVisible(false);
            }}
            className="shrink-0 text-[14px] font-semibold text-brass"
          >
            Cofnij
          </button>
        )}
      </div>
    </div>
  );
}

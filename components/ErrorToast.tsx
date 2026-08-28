"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useChatStore } from "@/store/chatStore";

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "error" | "success";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  const isSuccess = type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white max-w-sm w-full"
      style={{
        border: `1px solid ${isSuccess ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      {isSuccess ? (
        <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : (
        <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
      )}
      <p className="text-sm text-[#1f2937] flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="text-[#9ca3af] hover:text-[#4b5563] t-fast shrink-0"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function AppToast() {
  const toastError    = useChatStore((s) => s.toastError);
  const toastSuccess   = useChatStore((s) => s.toastSuccess);
  const dismissError   = useChatStore((s) => s.dismissError);
  const dismissSuccess = useChatStore((s) => s.dismissSuccess);

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toastSuccess && (
          <Toast key="success" message={toastSuccess} type="success" onDismiss={dismissSuccess} />
        )}
        {toastError && (
          <Toast key="error" message={toastError} type="error" onDismiss={dismissError} />
        )}
      </AnimatePresence>
    </div>
  );
}

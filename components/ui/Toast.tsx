"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to allow CSS transition to work
    const timerId = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timerId);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for transition out
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-sky-600" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 min-w-[300px] max-w-sm rounded-xl border shadow-sm transition-opacity duration-150 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${bgColors[type]}`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

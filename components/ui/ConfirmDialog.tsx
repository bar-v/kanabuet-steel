"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setRender(true), 0);
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setShow(false), 0);
      const timer = setTimeout(() => setRender(false), 300); // Wait for fade out
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog content */}
      <div
        className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md mx-4 overflow-hidden transition-opacity duration-150 ease-in-out ${
          show ? "opacity-100" : "opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div className="px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-50 sm:mx-0 sm:h-10 sm:w-10 border border-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-500" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3
                className="text-lg leading-6 font-bold text-slate-900"
                id="modal-headline"
              >
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm font-medium text-slate-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto transition-colors"
            onClick={onConfirm}
          >
            Ya, Lanjutkan
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-4 py-2 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:ml-3 sm:w-auto transition-colors"
            onClick={onCancel}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

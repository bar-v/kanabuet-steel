"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { C } from "@/lib/utils/theme";

export interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih salah satu...",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`w-full px-4 py-2.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? "bg-white ring-2 ring-orange-500 border-orange-500" : "bg-slate-50 hover:bg-white border-slate-200"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${!selectedOption ? "text-slate-400 font-medium" : "text-slate-800 font-bold"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">Tidak ada opsi</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected ? "bg-orange-50 text-orange-700 font-bold" : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                  onClick={() => {
                    onChange(String(opt.value));
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                  {isSelected && <Check size={16} className="text-orange-500" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

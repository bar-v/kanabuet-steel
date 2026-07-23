"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface MaterialOption {
  material_id: number;
  material_name: string;
  specification?: string | null;
  current_stock?: number;
  unit?: string;
}

interface MaterialSearchSelectProps {
  materials: MaterialOption[];
  value: number | "";
  onChange: (value: number | "") => void;
  borderColor?: string;
  showStock?: boolean;
  disableOutOfStock?: boolean;
}

export default function MaterialSearchSelect({
  materials,
  value,
  onChange,
  borderColor = "#e2e8f0",
  showStock = false,
  disableOutOfStock = false,
}: MaterialSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedMaterial = materials.find((m) => m.material_id === value);

  const filteredMaterials = materials.filter((m) =>
    m.material_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.specification || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".material-search-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative material-search-container mt-1">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className="w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none text-left flex items-center justify-between bg-white focus:border-emerald-500 transition-all"
        style={{ borderColor }}
      >
        <span className={selectedMaterial ? "text-slate-900" : "text-slate-400"}>
          {selectedMaterial
            ? `${selectedMaterial.material_name}${selectedMaterial.specification ? ' - ' + selectedMaterial.specification : ''}`
            : "Cari atau pilih material..."}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ borderColor }}
        >
          <div className="p-2 border-b flex items-center gap-2 bg-slate-50" style={{ borderColor }}>
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none font-medium text-slate-800"
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-48">
            {filteredMaterials.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                Material tidak ditemukan
              </div>
            ) : (
              filteredMaterials.map((m) => {
                const isOutOfStock = disableOutOfStock && (m.current_stock === undefined || m.current_stock <= 0);
                return (
                  <button
                    key={m.material_id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (isOutOfStock) return;
                      onChange(m.material_id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between
                      ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-emerald-50/30"}
                      ${m.material_id === value ? "bg-emerald-50/50 font-bold text-emerald-600" : "text-slate-700"}`}
                  >
                    <span className="truncate pr-4 flex flex-col">
                      <span>{m.material_name}{m.specification ? ` - ${m.specification}` : ''}</span>
                      {showStock && m.current_stock !== undefined && (
                        <span className="text-[10px] text-slate-500 font-medium">Sisa: {m.current_stock} {m.unit} {m.current_stock <= 0 ? '(Habis)' : ''}</span>
                      )}
                    </span>
                    {m.material_id === value && <Check size={14} className="text-emerald-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

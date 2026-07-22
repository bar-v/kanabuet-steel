"use client";

import { useState } from "react";
import { User } from "@/lib/types/database";
import { X, Save, Eye, EyeOff } from "lucide-react";
import { C } from "@/lib/utils/theme";

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const [fullname, setFullname] = useState(user.fullname);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname,
          email,
          ...(password ? { password } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui profil");
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: C.card, borderColor: C.border, borderWidth: 1 }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: C.border }}>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Edit Profil</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: C.muted }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex items-start gap-2">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block" style={{ color: C.text }}>
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block" style={{ color: C.text }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold block" style={{ color: C.text }}>
              Password Baru <span className="text-xs font-normal opacity-70">(Opsional)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                style={{ background: C.bg, borderColor: C.border, color: C.text }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100/50 transition-colors"
                style={{ color: C.muted }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && password.length < 6 && (
              <p className="text-xs text-orange-500 mt-1">
                Password minimal 6 karakter
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border hover:bg-slate-50 transition-colors"
              style={{ borderColor: C.border, color: C.text }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || (password.length > 0 && password.length < 6)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await loginAction(formData);

      if (result.error) {
        setErrorMsg(result.error);
        setIsLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      if (result.success && result.role) {
        if (result.role === "supervisor") {
          router.push("/dashboard/supervisor");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/*  Background image  */}
      <Image
        src="/images/login-bg.jpg"
        alt="Kanabuet Steel facility background"
        fill
        className="object-cover object-center"
        priority
        quality={80}
      />

      {/*  Dim overlay ~85%  */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]" />

      {/*  Login card  */}
      <div className="relative z-10 w-full max-w-[460px] mx-4">
        {/* Brand block */}
        <div className="flex items-center gap-4 mb-10">
          <Image
            src="/images/logo.png"
            alt="Kanabuet Steel logo"
            width={64}
            height={64}
            className="object-contain shrink-0 drop-shadow-sm"
            priority
          />
          <div className="flex flex-col">
            <span className="font-black text-orange-600 text-3xl tracking-[1px] leading-none uppercase">
              Kanabuet Steel
            </span>
            <span className="text-slate-600 text-sm font-medium tracking-wide mt-1">
              Sistem Manajemen Fabrikasi
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl">
          {/* Welcome text */}
          <div className="mb-6">
            <h1 className="font-bold text-slate-900 text-2xl tracking-tight leading-8">
              Selamat Datang
            </h1>
            <p className="text-sm text-slate-500 leading-5 mt-1">
              Masuk ke portal manajemen Kanabuet Steel.
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-email"
                className="text-xs font-bold text-slate-700 tracking-[0.6px] uppercase"
              >
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="13" viewBox="0 0 16 13" fill="none" aria-hidden="true">
                    <rect x="0.5" y="0.5" width="15" height="12" rx="1.5" stroke="#94A3B8" />
                    <path d="M1 1.5L8 7.5L15 1.5" stroke="#94A3B8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@kanabuet.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-base text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-password"
                className="text-xs font-bold text-slate-700 tracking-[0.6px] uppercase"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="13" height="16" viewBox="0 0 13 16" fill="none" aria-hidden="true">
                    <rect x="0.5" y="6.5" width="12" height="9" rx="1.5" stroke="#94A3B8" />
                    <path d="M3.5 6.5V4.5C3.5 2.84315 4.84315 1.5 6.5 1.5C8.15685 1.5 9.5 2.84315 9.5 4.5V6.5" stroke="#94A3B8" strokeLinecap="round" />
                    <circle cx="6.5" cy="11" r="1" fill="#94A3B8" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 rounded-lg text-base text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="mt-2 flex items-center justify-center gap-3 w-full py-3.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-lg font-semibold shadow-[0_4px_20px_rgba(249,115,22,0.30)] hover:shadow-[0_4px_28px_rgba(249,115,22,0.50)] transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Memproses…</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-6 font-medium drop-shadow-sm">
          © {new Date().getFullYear()} Kanabuet Steel. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}

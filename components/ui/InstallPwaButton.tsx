"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Cek apakah aplikasi sudah dalam mode standalone / PWA terinstall
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // 2. Deteksi apakah perangkat adalah iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // 3. Tangkap event beforeinstallprompt (Android / Chrome Desktop / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Reset jika app berhasil terinstal
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    // Munculkan dialog instalasi resmi browser
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Sembunyikan tombol jika sudah berjalan di mode PWA
  if (isStandalone) return null;

  // Jika bukan iOS dan event prompt belum siap, tidak tampilkan tombol
  if (!isIOS && !deferredPrompt) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm border border-slate-700 transition-all duration-200"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Instal Aplikasi Kanabuet</span>
      </button>

      {/* Modal Petunjuk Khusus Pengguna iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instal di iOS (Safari)</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Ikuti langkah singkat berikut untuk menambahkan aplikasi ke Layar Utama iPhone/iPad Anda:
            </p>
            <ol className="text-xs text-slate-700 space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-700 font-bold rounded-full">1</span>
                <span>Tekan tombol <strong>Bagikan (Share)</strong> di bilah bawah browser Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-700 font-bold rounded-full">2</span>
                <span>Pilih menu <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-700 font-bold rounded-full">3</span>
                <span>Tekan <strong>Tambah</strong> di pojok kanan atas.</span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

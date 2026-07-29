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
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah dalam mode standalone / PWA terinstall
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Deteksi apakah perangkat adalah iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Daftarkan Service Worker jika belum terdaftar (agar Chrome/Edge mengaktifkan fitur PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
      });
    }

    // Tangkap event beforeinstallprompt (Android / Chrome Desktop / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Reset jika app berhasil terinstal
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
    // Jika event beforeinstallprompt sudah ditangkap oleh browser, langsung pemicu dialog bawaan OS/browser
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    // Jika prompt belum siap (misal di iOS Safari, atau Chrome dev mode), tampilkan modal panduan instalasi
    setShowGuideModal(true);
  };

  // Sembunyikan tombol jika aplikasi sudah dibuka dari dalam PWA yang terinstall
  if (isStandalone) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Instal Aplikasi Kanabuet (PWA)</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Cara Menginstal Aplikasi</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {isIOS
                ? "Petunjuk instalasi khusus perangkat iOS (iPhone / iPad):"
                : "Aplikasi Kanabuet Steel siap diinstal ke komputer / HP Anda:"}
            </p>

            {isIOS ? (
              <ol className="text-xs text-slate-700 space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full text-[10px]">1</span>
                  <span>Tekan tombol <strong>Bagikan (Share)</strong> <span className="inline-block">⎋</span> di bilah bawah Safari.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full text-[10px]">2</span>
                  <span>Gulir dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full text-[10px]">3</span>
                  <span>Tekan <strong>Tambah</strong> di kanan atas.</span>
                </li>
              </ol>
            ) : (
              <ol className="text-xs text-slate-700 space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full text-[10px]">1</span>
                  <span>Di Chrome / Edge (Desktop), klik ikon Instal / Tambah di sebelah kanan bilah alamat (address bar).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-orange-500 text-white font-bold rounded-full text-[10px]">2</span>
                  <span>Atau buka menu browser (titik 3 di kanan atas) lalu pilih Instal Kanabuet Steel.</span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

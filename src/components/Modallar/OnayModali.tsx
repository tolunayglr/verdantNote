// ============================================================
// ONAY MODALI — "Emin misiniz?" penceresi
// Silme gibi geri alması zahmetli işlemlerden önce kullanıcıya sorar.
// (Silme zaten Geri Dönüşüm Kutusu'na taşır ama yine de sormak iyi
// bir alışkanlık — kullanıcı ne yaptığının farkında olmalı.)
// ============================================================

import { useEffect } from "react";

interface Props {
  baslik: string;      // Örn: "Dosyayı Sil"
  mesaj: string;       // Örn: 'notlar.html silinsin mi?'
  onaylaMetni: string; // Örn: "Sil"
  hata: string | null;
  onayla: () => void;
  iptal: () => void;
}

export function OnayModali({ baslik, mesaj, onaylaMetni, hata, onayla, iptal }: Props) {
  // Escape tuşu ile iptal edilebilsin
  useEffect(() => {
    const tusaBasildi = (olay: KeyboardEvent) => {
      if (olay.key === "Escape") iptal();
    };
    window.addEventListener("keydown", tusaBasildi);
    return () => window.removeEventListener("keydown", tusaBasildi);
  }, [iptal]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={iptal}
    >
      <div
        className="w-80 rounded-lg border border-zinc-300 bg-white p-4 shadow-2xl dark:border-zinc-600 dark:bg-zinc-800"
        onClick={(olay) => olay.stopPropagation()}
      >
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{baslik}</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-300">{mesaj}</p>

        {hata && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{hata}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={iptal}
            className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Vazgeç
          </button>
          {/* Silme tehlikeli işlem — düğme kırmızı olsun ki dikkat çeksin */}
          <button
            onClick={onayla}
            className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500"
          >
            {onaylaMetni}
          </button>
        </div>
      </div>
    </div>
  );
}

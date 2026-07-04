// ============================================================
// KATEGORİ ATAMA MODALI
// Sağ tık → "Kategori Ata" ile açılır. Mevcut kategorilerden biri
// seçilir (veya "Kategorisiz" ile atama kaldırılır).
// ============================================================

import { useEffect } from "react";
import { Ban } from "lucide-react";
import type { DosyaDugumu } from "../../types";
import { useKategoriDeposu } from "../../store/kategoriDeposu";

interface Props {
  hedef: DosyaDugumu; // Kategori atanacak dosya/klasör
  kapat: () => void;
}

export function KategoriAtaModali({ hedef, kapat }: Props) {
  const kategoriler = useKategoriDeposu((d) => d.kategoriler);
  const atamalar = useKategoriDeposu((d) => d.atamalar);
  const kategoriAta = useKategoriDeposu((d) => d.kategoriAta);

  const mevcutKategoriId = atamalar[hedef.yol] ?? null;

  // Escape ile kapat
  useEffect(() => {
    const tusaBasildi = (olay: KeyboardEvent) => {
      if (olay.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tusaBasildi);
    return () => window.removeEventListener("keydown", tusaBasildi);
  }, [kapat]);

  // Seçim yapılınca ata ve modalı kapat (ayrıca onay düğmesi gerekmez)
  const sec = async (kategoriId: string | null) => {
    await kategoriAta(hedef.yol, kategoriId);
    kapat();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={kapat}
    >
      <div
        className="w-80 rounded-lg border border-zinc-300 bg-white p-4 shadow-2xl dark:border-zinc-600 dark:bg-zinc-800"
        onClick={(olay) => olay.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Kategori Ata
        </h2>
        <p className="mb-3 truncate text-xs text-zinc-500 dark:text-zinc-400">
          "{hedef.isim}" için bir kategori seçin.
        </p>

        {kategoriler.length === 0 && (
          <p className="py-2 text-xs text-zinc-500">
            Henüz kategori yok. Gezgin başlığındaki etiket 🏷 düğmesinden
            kategori oluşturabilirsiniz.
          </p>
        )}

        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {kategoriler.map((kategori) => (
            <button
              key={kategori.id}
              onClick={() => sec(kategori.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm
                ${kategori.id === mevcutKategoriId
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-600/30 dark:text-blue-200"
                  : "text-zinc-800 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-700"}`}
            >
              {/* Kategorinin rengi — küçük yuvarlak rozet */}
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: kategori.renk }}
              />
              {kategori.isim}
            </button>
          ))}

          {/* Mevcut atamayı kaldırma seçeneği */}
          {mevcutKategoriId && (
            <button
              onClick={() => sec(null)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <Ban size={12} className="shrink-0" />
              Kategoriyi kaldır
            </button>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={kapat}
            className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

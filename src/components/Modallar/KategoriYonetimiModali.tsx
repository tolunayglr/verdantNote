// ============================================================
// KATEGORİ YÖNETİMİ MODALI
// Gezgin başlığındaki etiket düğmesiyle açılır.
// İstenildiği kadar kategori oluşturulabilir (isim + renk) ve silinebilir.
// ============================================================

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useKategoriDeposu } from "../../store/kategoriDeposu";

interface Props {
  kapat: () => void;
}

export function KategoriYonetimiModali({ kapat }: Props) {
  const kategoriler = useKategoriDeposu((d) => d.kategoriler);
  const kategoriEkle = useKategoriDeposu((d) => d.kategoriEkle);
  const kategoriSil = useKategoriDeposu((d) => d.kategoriSil);

  const [yeniIsim, setYeniIsim] = useState("");
  const [yeniRenk, setYeniRenk] = useState("#f59e0b"); // Varsayılan: amber

  // Escape ile kapat
  useEffect(() => {
    const tusaBasildi = (olay: KeyboardEvent) => {
      if (olay.key === "Escape") kapat();
    };
    window.addEventListener("keydown", tusaBasildi);
    return () => window.removeEventListener("keydown", tusaBasildi);
  }, [kapat]);

  const ekle = async () => {
    const temizIsim = yeniIsim.trim();
    if (temizIsim.length === 0) return; // Boş isimle kategori olmaz
    await kategoriEkle(temizIsim, yeniRenk);
    setYeniIsim(""); // Kutuyu temizle — art arda ekleme kolay olsun
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={kapat}
    >
      <div
        className="w-96 rounded-lg border border-zinc-300 bg-white p-4 shadow-2xl dark:border-zinc-600 dark:bg-zinc-800"
        onClick={(olay) => olay.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Kategorileri Yönet
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Renk ve etiket vererek istediğiniz kadar kategori oluşturun.
        </p>

        {/* Yeni kategori ekleme satırı */}
        <div className="mb-3 flex items-center gap-2">
          {/* input type="color": tarayıcının yerleşik renk seçicisi */}
          <input
            type="color"
            value={yeniRenk}
            onChange={(olay) => setYeniRenk(olay.target.value)}
            title="Kategori rengi"
            className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-600"
          />
          <input
            value={yeniIsim}
            onChange={(olay) => setYeniIsim(olay.target.value)}
            onKeyDown={(olay) => {
              if (olay.key === "Enter") ekle();
            }}
            placeholder="Kategori adı (örn: Önemli, İş, Arşiv)"
            className="w-full rounded border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={ekle}
            title="Kategori ekle"
            className="shrink-0 rounded bg-blue-600 p-1.5 text-white hover:bg-blue-500"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Mevcut kategoriler listesi */}
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {kategoriler.length === 0 && (
            <p className="py-2 text-xs text-zinc-500">Henüz kategori yok.</p>
          )}
          {kategoriler.map((kategori) => (
            <div
              key={kategori.id}
              className="group flex items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-800 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: kategori.renk }}
              />
              <span className="flex-1 truncate">{kategori.isim}</span>
              <button
                onClick={() => kategoriSil(kategori.id)}
                title="Kategoriyi sil (dosya atamaları da kaldırılır)"
                className="rounded p-1 text-red-500 opacity-0 hover:bg-red-100 group-hover:opacity-100 dark:hover:bg-red-950"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
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

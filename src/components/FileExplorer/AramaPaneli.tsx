// ============================================================
// ARAMA PANELİ — gezginin üstündeki arama kutusu + sonuç listesi
// Yazdıkça arar (300 ms debounce ile) — asıl taramayı Rust yapar.
// ============================================================

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { AramaSonucu } from "../../types";
import { calismaAlanindaAra } from "../../lib/tauriKoprusu";
import { useGezginDeposu } from "../../store/gezginDeposu";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";

export function AramaPaneli() {
  const aramaSorgusu = useGezginDeposu((d) => d.aramaSorgusu);
  const aramaSorgusunuAyarla = useGezginDeposu((d) => d.aramaSorgusunuAyarla);
  const dosyaAc = useUygulamaDeposu((d) => d.dosyaAc);
  const [sonuclar, setSonuclar] = useState<AramaSonucu[]>([]);
  const [araniyor, setAraniyor] = useState(false);

  // Debounce: kullanıcı yazmayı bırakınca 300 ms sonra ara.
  // Her tuş vuruşunda Rust'a gitmek gereksiz yük olurdu.
  useEffect(() => {
    if (aramaSorgusu.trim() === "") {
      setSonuclar([]);
      return;
    }

    setAraniyor(true);
    const zamanlayici = setTimeout(async () => {
      try {
        const bulunanlar = await calismaAlanindaAra(aramaSorgusu);
        setSonuclar(bulunanlar);
      } catch {
        setSonuclar([]); // Çalışma alanı yoksa vb. — sessizce boş göster
      } finally {
        setAraniyor(false);
      }
    }, 300);

    // Temizlik: sorgu değişirse önceki bekleyen aramayı iptal et
    return () => clearTimeout(zamanlayici);
  }, [aramaSorgusu]);

  return (
    <>
      {/* Arama kutusu */}
      <div className="flex items-center gap-1.5 border-b border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
        <Search size={13} className="shrink-0 text-zinc-500" />
        <input
          value={aramaSorgusu}
          onChange={(olay) => aramaSorgusunuAyarla(olay.target.value)}
          placeholder="Çalışma alanında ara..."
          className="w-full bg-transparent text-xs text-zinc-800 outline-none placeholder:text-zinc-500 dark:text-zinc-200"
        />
        {/* Sorgu varken temizleme düğmesi göster */}
        {aramaSorgusu && (
          <button
            onClick={() => aramaSorgusunuAyarla("")}
            title="Aramayı temizle"
            className="rounded p-0.5 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Sonuç listesi — sadece sorgu varken görünür (ağacın yerini alır) */}
      {aramaSorgusu.trim() !== "" && (
        <div className="flex-1 overflow-y-auto py-1">
          {araniyor && (
            <p className="px-3 py-2 text-xs text-zinc-500">Aranıyor...</p>
          )}

          {!araniyor && sonuclar.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-500">Sonuç bulunamadı.</p>
          )}

          {sonuclar.map((sonuc, indeks) => (
            <button
              // Aynı dosyada birden çok eşleşme olabilir — indeks ile benzersizleştir
              key={`${sonuc.yol}-${sonuc.satirNo}-${indeks}`}
              onClick={() => dosyaAc(sonuc.yol, sonuc.isim)}
              className="block w-full px-3 py-1 text-left hover:bg-zinc-300/60 dark:hover:bg-zinc-700/50"
            >
              <span className="block truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {sonuc.isim}
                {/* satirNo = 0 → dosya adı eşleşmesi, > 0 → içerik eşleşmesi */}
                {sonuc.satirNo > 0 && (
                  <span className="ml-1 font-normal text-zinc-500">
                    satır {sonuc.satirNo}
                  </span>
                )}
              </span>
              {sonuc.satirOzeti && (
                <span className="block truncate text-[11px] text-zinc-500">
                  {sonuc.satirOzeti}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

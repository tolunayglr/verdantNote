// ============================================================
// SEKME ÇUBUĞU — Notepad++ tarzı çoklu sekme
// Kaydedilmemiş değişiklik olan sekmede "●" işareti gösterilir.
//
// Faz 4: sekmeler sürüklenerek yeniden sıralanabilir.
// ============================================================

import { useState } from "react";
import { X } from "lucide-react";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";

export function TabBar() {
  const sekmeler = useUygulamaDeposu((d) => d.sekmeler);
  const aktifSekmeYolu = useUygulamaDeposu((d) => d.aktifSekmeYolu);
  const aktifSekmeyiDegistir = useUygulamaDeposu((d) => d.aktifSekmeyiDegistir);
  const sekmeKapat = useUygulamaDeposu((d) => d.sekmeKapat);
  const sekmeSirasiniDegistir = useUygulamaDeposu((d) => d.sekmeSirasiniDegistir);

  // Sürüklenen sekme şu an hangi sekmenin üzerinde? (görsel vurgu için)
  const [uzerindekiSekme, setUzerindekiSekme] = useState<string | null>(null);

  return (
    <div className="flex h-9 items-end overflow-x-auto border-b border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
      {sekmeler.map((sekme) => {
        const aktifMi = sekme.yol === aktifSekmeYolu;
        const surukleHedefiMi = uzerindekiSekme === sekme.yol;
        return (
          <div
            key={sekme.yol}
            onClick={() => aktifSekmeyiDegistir(sekme.yol)}
            // --- SEKME SIRALAMA (sürükle-bırak) ---
            // "text/sekme" özel anahtarı: gezgindeki dosya sürüklemesiyle
            // (text/plain) karışmasın diye farklı isim kullanıyoruz.
            draggable
            onDragStart={(olay) => {
              olay.dataTransfer.setData("text/sekme", sekme.yol);
              olay.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(olay) => {
              // Sadece sekme sürükleniyorsa bırakma hedefi ol
              if (olay.dataTransfer.types.includes("text/sekme")) {
                olay.preventDefault();
                setUzerindekiSekme(sekme.yol);
              }
            }}
            onDragLeave={() => setUzerindekiSekme(null)}
            onDrop={(olay) => {
              olay.preventDefault();
              setUzerindekiSekme(null);
              const kaynakYol = olay.dataTransfer.getData("text/sekme");
              if (kaynakYol && kaynakYol !== sekme.yol) {
                sekmeSirasiniDegistir(kaynakYol, sekme.yol);
              }
            }}
            className={`group flex cursor-pointer items-center gap-2 border-r border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700
              ${aktifMi
                ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white" // Aktif sekme: öne çıkık
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"}
              ${surukleHedefiMi ? "border-l-2 border-l-blue-500" : ""}`}
          >
            {/* Kaydedilmemiş değişiklik varsa "●" göster (Notepad++ mantığı) */}
            <span>
              {sekme.kaydedilmemisDegisiklikVar && (
                <span className="mr-1 text-amber-500 dark:text-amber-400">●</span>
              )}
              {sekme.baslik}
            </span>

            {/* Kapatma düğmesi */}
            <button
              onClick={(olay) => {
                olay.stopPropagation(); // Sekmeye tıklama olayını tetikleme!
                if (
                  sekme.kaydedilmemisDegisiklikVar &&
                  !confirm(`"${sekme.baslik}" dosyasında kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?`)
                ) {
                  return;
                }
                sekmeKapat(sekme.yol);
              }}
              className="rounded p-0.5 opacity-0 hover:bg-zinc-300 group-hover:opacity-100 dark:hover:bg-zinc-600"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

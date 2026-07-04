// ============================================================
// AĞAÇ DÜĞÜMÜ — dosya gezginindeki tek bir satır
// Özyineleme (recursion) nedir? Bir bileşenin kendi içinde kendini
// çağırması. Klasörler iç içe olduğu için ağacı çizmenin en doğal yolu.
//
// Faz 2 eklentileri: sağ tık menüsü, sürükle-bırak, otomatik yenileme.
// ============================================================

import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import type { DosyaDugumu } from "../../types";
import { klasorIceriginiListele } from "../../lib/tauriKoprusu";
import { dosyaTasi } from "../../lib/suruklemeIslemleri";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";
import { useGezginDeposu } from "../../store/gezginDeposu";
import { useKategoriDeposu } from "../../store/kategoriDeposu";

interface Props {
  dugum: DosyaDugumu;
  derinlik: number; // İç içe seviyesi — girinti (indent) hesabı için
}

export function AgacDugumu({ dugum, derinlik }: Props) {
  const [acik, setAcik] = useState(false);              // Klasör açık mı?
  const [cocuklar, setCocuklar] = useState<DosyaDugumu[] | null>(null);
  // Sürüklenen bir öğe şu an bu klasörün üzerinde mi? (görsel vurgu için)
  const [surukleUzerinde, setSurukleUzerinde] = useState(false);

  const dosyaAc = useUygulamaDeposu((d) => d.dosyaAc);
  const menuAc = useGezginDeposu((d) => d.menuAc);
  const yenilemeSayaci = useGezginDeposu((d) => d.yenilemeSayaci);
  const hataGoster = useGezginDeposu((d) => d.hataGoster);

  // Bu dosyaya atanmış kategori var mı? (renkli nokta göstermek için)
  const kategoriId = useKategoriDeposu((d) => d.atamalar[dugum.yol]);
  const kategori = useKategoriDeposu((d) =>
    d.kategoriler.find((k) => k.id === kategoriId)
  );

  // Dosya işlemi yapılınca (oluştur/sil/taşı) sayaç artar —
  // içeriği daha önce yüklenmiş AÇIK klasörler kendini tazeler.
  useEffect(() => {
    if (dugum.klasorMu && cocuklar !== null) {
      klasorIceriginiListele(dugum.yol)
        .then(setCocuklar)
        .catch(() => setCocuklar([])); // Klasör silinmiş olabilir — boş göster
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yenilemeSayaci]);

  // Satıra tıklanınca: klasörse aç/kapat, dosyaysa sekmede aç
  const tiklandi = async () => {
    if (dugum.klasorMu) {
      // İçeriği daha önce yüklenmediyse ŞİMDİ yükle
      // (lazy loading — tembel yükleme)
      if (!acik && cocuklar === null) {
        const icerik = await klasorIceriginiListele(dugum.yol);
        setCocuklar(icerik);
      }
      setAcik(!acik);
    } else if (!dugum.metinMi) {
      // İkili (binary) dosya — görsel, arşiv vb. Editörde açılamaz.
      hataGoster(`"${dugum.isim}" metin dosyası değil, açılamıyor.`);
    } else {
      await dosyaAc(dugum.yol, dugum.isim);
    }
  };

  return (
    <div>
      {/* Satırın kendisi — derinliğe göre soldan girinti */}
      <button
        onClick={tiklandi}
        // Sağ tık: tarayıcının kendi menüsünü engelle, bizimkini aç.
        // stopPropagation: olay üstteki boş-alan menüsünü de tetiklemesin.
        onContextMenu={(olay) => {
          olay.preventDefault();
          olay.stopPropagation();
          menuAc(olay.clientX, olay.clientY, dugum);
        }}
        // --- SÜRÜKLE-BIRAK ---
        // draggable: bu satır fareyle sürüklenebilir olsun
        draggable
        onDragStart={(olay) => {
          // Sürüklenen öğenin yolunu "pakete" koy — bırakılınca okunacak
          olay.dataTransfer.setData("text/plain", dugum.yol);
          olay.dataTransfer.effectAllowed = "move";
        }}
        // Bırakma hedefi SADECE klasörler olabilir
        onDragOver={(olay) => {
          if (!dugum.klasorMu) return;
          olay.preventDefault(); // preventDefault demek "buraya bırakılabilir" demek
          olay.stopPropagation();
          setSurukleUzerinde(true);
        }}
        onDragLeave={() => setSurukleUzerinde(false)}
        onDrop={async (olay) => {
          if (!dugum.klasorMu) return;
          olay.preventDefault();
          olay.stopPropagation();
          setSurukleUzerinde(false);
          const kaynakYol = olay.dataTransfer.getData("text/plain");
          if (kaynakYol) await dosyaTasi(kaynakYol, dugum.yol);
        }}
        className={`flex w-full items-center gap-1 rounded px-2 py-0.5 text-sm
          ${surukleUzerinde ? "bg-blue-600/40" : "hover:bg-zinc-300/60 dark:hover:bg-zinc-700/50"}
          ${!dugum.klasorMu && !dugum.metinMi ? "opacity-40" : ""}`}
        style={{ paddingLeft: `${derinlik * 14 + 8}px` }}
      >
        {dugum.klasorMu ? (
          <>
            {acik ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-amber-500 dark:text-amber-400" />
          </>
        ) : (
          <FileText size={14} className="ml-[14px] text-zinc-500 dark:text-zinc-400" />
        )}
        <span className="truncate">{dugum.isim}</span>

        {/* Kategori atanmışsa renkli nokta göster (isim = ipucu olarak) */}
        {kategori && (
          <span
            title={kategori.isim}
            className="ml-auto mr-1 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: kategori.renk }}
          />
        )}
      </button>

      {/* Klasör açıksa çocuklarını çiz — İŞTE ÖZYİNELEME BURADA:
          AgacDugumu kendi içinde yine AgacDugumu çağırıyor */}
      {acik &&
        cocuklar?.map((cocuk) => (
          <AgacDugumu key={cocuk.yol} dugum={cocuk} derinlik={derinlik + 1} />
        ))}
    </div>
  );
}

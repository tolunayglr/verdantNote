// ============================================================
// DOSYA GEZGİNİ — sol panel (Notepad++ tarzı)
// Çalışma alanı seçtirir ve kök klasörün ağacını gösterir.
//
// Faz 4 eklentileri: arama paneli, açık/koyu tema düğmesi.
// ============================================================

import { useEffect, useState } from "react";
import { FolderOpen, Moon, Sun, Tag } from "lucide-react";
import type { DosyaDugumu } from "../../types";
import {
  calismaAlaniSec,
  kayitliCalismaAlaniniYukle,
  klasorIceriginiListele,
} from "../../lib/tauriKoprusu";
import { dosyaTasi } from "../../lib/suruklemeIslemleri";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";
import { useGezginDeposu } from "../../store/gezginDeposu";
import { useTemaDeposu } from "../../store/temaDeposu";
import { AgacDugumu } from "./AgacDugumu";
import { SagTikMenusu } from "./SagTikMenusu";
import { GezginModallari } from "./GezginModallari";
import { AramaPaneli } from "./AramaPaneli";

export function FileExplorer() {
  const calismaAlaniYolu = useUygulamaDeposu((d) => d.calismaAlaniYolu);
  const calismaAlaniAyarla = useUygulamaDeposu((d) => d.calismaAlaniAyarla);
  const menuAc = useGezginDeposu((d) => d.menuAc);
  const yenilemeSayaci = useGezginDeposu((d) => d.yenilemeSayaci);
  const hataMesaji = useGezginDeposu((d) => d.hataMesaji);
  const aramaSorgusu = useGezginDeposu((d) => d.aramaSorgusu);
  const koyuTema = useTemaDeposu((d) => d.koyuTema);
  const temayiDegistir = useTemaDeposu((d) => d.temayiDegistir);
  const [kokDugumler, setKokDugumler] = useState<DosyaDugumu[]>([]);

  // UYGULAMA AÇILIŞINDA (sadece 1 kez): kayıtlı çalışma alanı var mı?
  // Varsa otomatik yükle — kullanıcı her seferinde klasör seçmek zorunda kalmasın.
  useEffect(() => {
    kayitliCalismaAlaniniYukle().then((yol) => {
      if (yol) calismaAlaniAyarla(yol);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Çalışma alanı değişince VEYA ağaç yenilenince kök içeriği yükle
  useEffect(() => {
    if (!calismaAlaniYolu) return;
    klasorIceriginiListele(calismaAlaniYolu).then(setKokDugumler);
  }, [calismaAlaniYolu, yenilemeSayaci]);

  const klasorSecTiklandi = async () => {
    const yol = await calismaAlaniSec(); // Yerel klasör seçme penceresi
    if (yol) calismaAlaniAyarla(yol);
  };

  // Arama aktifken ağaç gizlenir — sonuç listesi onun yerini alır
  const aramaAktif = aramaSorgusu.trim() !== "";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {/* Panel başlığı */}
      <div className="flex items-center justify-between border-b border-zinc-300 px-3 py-2 dark:border-zinc-700">
        <span className="text-xs font-semibold uppercase tracking-wide">Dosyalar</span>
        <div className="flex items-center gap-1">
          {/* Kategori yönetimi */}
          <button
            onClick={() => useGezginDeposu.getState().modalAc({ tur: "kategoriYonetimi" })}
            title="Kategorileri yönet"
            className="rounded p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            <Tag size={16} />
          </button>
          {/* Tema değiştirme: koyudayken güneş, açıktayken ay göster */}
          <button
            onClick={temayiDegistir}
            title={koyuTema ? "Açık temaya geç" : "Koyu temaya geç"}
            className="rounded p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            {koyuTema ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={klasorSecTiklandi}
            title="Çalışma alanı seç"
            className="rounded p-1 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            <FolderOpen size={16} />
          </button>
        </div>
      </div>

      {/* Arama kutusu (ve sorgu varsa sonuç listesi) */}
      {calismaAlaniYolu && <AramaPaneli />}

      {/* Ağaç veya boş durum mesajı — arama aktifken gizli */}
      {!aramaAktif && (
        <div
          className="flex-1 overflow-y-auto py-1"
          // Boş alana sağ tık → kök dizin için menü (dugum = null)
          onContextMenu={(olay) => {
            if (!calismaAlaniYolu) return;
            olay.preventDefault();
            menuAc(olay.clientX, olay.clientY, null);
          }}
          // Boş alana bırakma → kök dizine taşı
          onDragOver={(olay) => {
            if (calismaAlaniYolu) olay.preventDefault();
          }}
          onDrop={async (olay) => {
            if (!calismaAlaniYolu) return;
            olay.preventDefault();
            const kaynakYol = olay.dataTransfer.getData("text/plain");
            if (kaynakYol) await dosyaTasi(kaynakYol, calismaAlaniYolu);
          }}
        >
          {calismaAlaniYolu ? (
            kokDugumler.map((dugum) => (
              <AgacDugumu key={dugum.yol} dugum={dugum} derinlik={0} />
            ))
          ) : (
            <p className="px-3 py-4 text-xs text-zinc-500">
              Henüz çalışma alanı seçilmedi. Yukarıdaki klasör ikonuna tıklayın.
            </p>
          )}
        </div>
      )}

      {/* Hata çubuğu: taşıma vb. başarısız olursa 4 saniye görünür */}
      {hataMesaji && (
        <div className="border-t border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {hataMesaji}
        </div>
      )}

      {/* Sağ tık menüsü ve modallar (kapalıyken hiçbir şey çizmezler) */}
      <SagTikMenusu />
      <GezginModallari />
    </aside>
  );
}

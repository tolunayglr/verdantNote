// ============================================================
// SAĞ TIK MENÜSÜ (Context Menu)
// Gezginde bir öğeye sağ tıklanınca açılan menü.
// Menü içeriği tıklanan şeye göre değişir:
//   - Boş alan  → Yeni Dosya, Yeni Klasör (kök dizine)
//   - Klasör    → Yeni Dosya, Yeni Klasör (içine) + Yeniden Adlandır, Sil
//   - Dosya     → Yeniden Adlandır, Sil
// ============================================================

import { useEffect } from "react";
import { FilePlus, FolderPlus, Pencil, Tag, Trash2 } from "lucide-react";
import { useGezginDeposu } from "../../store/gezginDeposu";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";
import { ustKlasor } from "../../lib/yolYardimcilari";

export function SagTikMenusu() {
  const menu = useGezginDeposu((d) => d.sagTikMenu);
  const menuKapat = useGezginDeposu((d) => d.menuKapat);
  const modalAc = useGezginDeposu((d) => d.modalAc);
  const calismaAlaniYolu = useUygulamaDeposu((d) => d.calismaAlaniYolu);

  // Menü dışına tıklanınca veya Escape'e basılınca menüyü kapat
  useEffect(() => {
    if (!menu) return;
    const kapat = () => menuKapat();
    const tusaBasildi = (olay: KeyboardEvent) => {
      if (olay.key === "Escape") menuKapat();
    };
    window.addEventListener("click", kapat);
    window.addEventListener("keydown", tusaBasildi);
    return () => {
      window.removeEventListener("click", kapat);
      window.removeEventListener("keydown", tusaBasildi);
    };
  }, [menu, menuKapat]);

  if (!menu || !calismaAlaniYolu) return null;

  const { dugum } = menu;

  // "Yeni dosya/klasör nereye oluşturulacak?" hesabı:
  // boş alan → kök, klasör → o klasörün içi
  const hedefKlasor = dugum
    ? dugum.klasorMu
      ? dugum.yol
      : ustKlasor(dugum.yol)
    : calismaAlaniYolu;

  // Oluşturma seçenekleri boş alanda ve klasörlerde görünür (dosyada değil)
  const olusturmaGoster = dugum === null || dugum.klasorMu;

  // Menü ekranın sağ/alt kenarından taşmasın diye konumu sınırla
  const sol = Math.min(menu.x, window.innerWidth - 180);
  const ust = Math.min(menu.y, window.innerHeight - 160);

  // Menü satırlarının ortak stili
  const satirSinifi =
    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-700";

  return (
    <div
      className="fixed z-50 w-44 rounded-md border border-zinc-300 bg-white py-1 shadow-2xl dark:border-zinc-600 dark:bg-zinc-800"
      style={{ left: sol, top: ust }}
    >
      {olusturmaGoster && (
        <>
          <button
            className={satirSinifi}
            onClick={() => modalAc({ tur: "yeniDosya", hedefKlasor })}
          >
            <FilePlus size={14} /> Yeni Dosya
          </button>
          <button
            className={satirSinifi}
            onClick={() => modalAc({ tur: "yeniKlasor", hedefKlasor })}
          >
            <FolderPlus size={14} /> Yeni Klasör
          </button>
        </>
      )}

      {/* Yeniden adlandır ve sil sadece bir öğeye tıklanınca görünür */}
      {dugum && (
        <>
          {olusturmaGoster && <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />}
          <button
            className={satirSinifi}
            onClick={() => modalAc({ tur: "kategoriAta", hedef: dugum })}
          >
            <Tag size={14} /> Kategori Ata
          </button>
          <button
            className={satirSinifi}
            onClick={() => modalAc({ tur: "yenidenAdlandir", hedef: dugum })}
          >
            <Pencil size={14} /> Yeniden Adlandır
          </button>
          <button
            className={`${satirSinifi} text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300`}
            onClick={() => modalAc({ tur: "sil", hedef: dugum })}
          >
            <Trash2 size={14} /> Sil
          </button>
        </>
      )}
    </div>
  );
}

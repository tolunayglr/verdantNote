// ============================================================
// GEZGİN DEPOSU (Zustand)
// Dosya gezgininin ARAYÜZ durumu: sağ tık menüsü nerede açık,
// hangi modal görünüyor, ağaç ne zaman yenilenmeli.
//
// Neden ayrı depo? uygulamaDeposu "veri" tutar (sekmeler, içerik).
// Burası ise geçici "arayüz" durumu tutar. Ayırmak kodu düzenli tutar.
// ============================================================

import { create } from "zustand";
import type { DosyaDugumu } from "../types";

// Açık olabilecek modal türleri.
// "Discriminated union" (ayırt edici birleşim): "tur" alanına bakarak
// TypeScript hangi ek alanların var olduğunu otomatik bilir.
export type ModalDurumu =
  | { tur: "yeniDosya"; hedefKlasor: string }
  | { tur: "yeniKlasor"; hedefKlasor: string }
  | { tur: "yenidenAdlandir"; hedef: DosyaDugumu }
  | { tur: "sil"; hedef: DosyaDugumu }
  | { tur: "kategoriAta"; hedef: DosyaDugumu }  // Dosyaya kategori seçme
  | { tur: "kategoriYonetimi" }                 // Kategori oluşturma/silme paneli
  | null;

// Sağ tık menüsünün durumu: ekrandaki konumu + hangi öğeye tıklandığı.
// dugum === null → boş alana (çalışma alanı köküne) sağ tıklandı demek.
interface SagTikMenuDurumu {
  x: number;
  y: number;
  dugum: DosyaDugumu | null;
}

interface GezginDeposu {
  // --- VERİLER ---
  sagTikMenu: SagTikMenuDurumu | null; // null = menü kapalı
  modal: ModalDurumu;                  // null = modal kapalı
  yenilemeSayaci: number;              // Artınca tüm açık klasörler yeniden yüklenir
  hataMesaji: string | null;           // Panelin altında gösterilen geçici hata
  aramaSorgusu: string;                // Boş değilse ağaç yerine arama sonuçları görünür

  // --- FONKSİYONLAR ---
  menuAc: (x: number, y: number, dugum: DosyaDugumu | null) => void;
  menuKapat: () => void;
  modalAc: (modal: ModalDurumu) => void;
  modalKapat: () => void;
  agaciYenile: () => void;
  hataGoster: (mesaj: string) => void;
  aramaSorgusunuAyarla: (sorgu: string) => void;
}

export const useGezginDeposu = create<GezginDeposu>((set) => ({
  sagTikMenu: null,
  modal: null,
  yenilemeSayaci: 0,
  hataMesaji: null,
  aramaSorgusu: "",

  menuAc: (x, y, dugum) => set({ sagTikMenu: { x, y, dugum } }),
  menuKapat: () => set({ sagTikMenu: null }),

  // Modal açılırken menüyü de kapat (ikisi aynı anda açık kalmasın)
  modalAc: (modal) => set({ modal, sagTikMenu: null }),
  modalKapat: () => set({ modal: null }),

  // Sayacı 1 artır — bu sayacı dinleyen bileşenler içeriklerini tazeler
  agaciYenile: () =>
    set((durum) => ({ yenilemeSayaci: durum.yenilemeSayaci + 1 })),

  // Hata mesajını göster, 4 saniye sonra otomatik temizle
  hataGoster: (mesaj) => {
    set({ hataMesaji: mesaj });
    setTimeout(() => set({ hataMesaji: null }), 4000);
  },

  aramaSorgusunuAyarla: (sorgu) => set({ aramaSorgusu: sorgu }),
}));

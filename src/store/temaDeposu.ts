// ============================================================
// TEMA DEPOSU — açık/koyu tema geçişi
//
// Nasıl çalışıyor? <html> etiketine "koyu" sınıfını ekleyip
// çıkarıyoruz. Tailwind'e "dark: ile başlayan stiller ancak
// .koyu sınıfının altındayken geçerli olsun" dedik (App.css'te).
// Tercih, ayar dosyasına kaydedilir — açılışta hatırlanır.
// ============================================================

import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

const AYAR_DOSYASI = "ayarlar.json";
const TEMA_ANAHTARI = "koyuTema";

// <html class="koyu"> ekle/çıkar — tüm dark: stilleri buna bağlı
function temayiUygula(koyu: boolean) {
  document.documentElement.classList.toggle("koyu", koyu);
}

interface TemaDeposu {
  koyuTema: boolean;
  temayiDegistir: () => Promise<void>;
  kayitliTemayiYukle: () => Promise<void>;
}

export const useTemaDeposu = create<TemaDeposu>((set, get) => ({
  koyuTema: true, // Varsayılan koyu — uygulamanın ilk tasarımı koyuydu

  // Düğmeye basılınca: tersine çevir, uygula, diske kaydet
  temayiDegistir: async () => {
    const yeniDeger = !get().koyuTema;
    set({ koyuTema: yeniDeger });
    temayiUygula(yeniDeger);

    const ayarlar = await load(AYAR_DOSYASI);
    await ayarlar.set(TEMA_ANAHTARI, yeniDeger);
    await ayarlar.save();
  },

  // Uygulama açılışında kayıtlı tercihi oku
  kayitliTemayiYukle: async () => {
    try {
      const ayarlar = await load(AYAR_DOSYASI);
      const kayitli = await ayarlar.get<boolean>(TEMA_ANAHTARI);
      // Hiç kayıt yoksa varsayılan (koyu) kalsın
      const koyu = kayitli ?? true;
      set({ koyuTema: koyu });
      temayiUygula(koyu);
    } catch {
      temayiUygula(true); // Ayar okunamazsa koyu temayla devam
    }
  },
}));

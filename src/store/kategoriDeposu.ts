// ============================================================
// KATEGORİ DEPOSU — dosya kategorileri (renk + etiket)
//
// İki veri tutar:
//   1. kategoriler: kullanıcının oluşturduğu kategori listesi
//   2. atamalar: hangi dosya hangi kategoride? (yol → kategori id)
// Her değişiklik "kategoriler.json" ayar dosyasına yazılır — kalıcıdır.
// ============================================================

import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";
import type { Kategori } from "../types";

const AYAR_DOSYASI = "kategoriler.json";

interface KategoriDeposu {
  // --- VERİLER ---
  kategoriler: Kategori[];
  atamalar: Record<string, string>; // dosya yolu → kategori id

  // --- FONKSİYONLAR ---
  kayitlilariYukle: () => Promise<void>;
  kategoriEkle: (isim: string, renk: string) => Promise<void>;
  kategoriSil: (id: string) => Promise<void>;
  kategoriAta: (yol: string, kategoriId: string | null) => Promise<void>;
  // Dosya taşınınca/silinince atamaları güncel tutmak için:
  yolGuncelle: (eskiYol: string, yeniYol: string) => Promise<void>;
  yolSil: (yol: string) => Promise<void>;
}

// Mevcut durumu diske yaz (her değişiklikten sonra çağrılır)
async function diskeKaydet(kategoriler: Kategori[], atamalar: Record<string, string>) {
  const ayarlar = await load(AYAR_DOSYASI);
  await ayarlar.set("kategoriler", kategoriler);
  await ayarlar.set("atamalar", atamalar);
  await ayarlar.save();
}

export const useKategoriDeposu = create<KategoriDeposu>((set, get) => ({
  kategoriler: [],
  atamalar: {},

  // Uygulama açılışında kayıtlı kategorileri ve atamaları oku
  kayitlilariYukle: async () => {
    try {
      const ayarlar = await load(AYAR_DOSYASI);
      const kategoriler = (await ayarlar.get<Kategori[]>("kategoriler")) ?? [];
      const atamalar = (await ayarlar.get<Record<string, string>>("atamalar")) ?? {};
      set({ kategoriler, atamalar });
    } catch {
      // İlk açılışta dosya yoktur — boş başla, sorun değil
    }
  },

  kategoriEkle: async (isim, renk) => {
    const yeniKategori: Kategori = {
      // crypto.randomUUID(): tarayıcının benzersiz kimlik üreticisi
      id: crypto.randomUUID(),
      isim,
      renk,
    };
    const kategoriler = [...get().kategoriler, yeniKategori];
    set({ kategoriler });
    await diskeKaydet(kategoriler, get().atamalar);
  },

  // Kategori silinince ona bağlı tüm dosya atamaları da temizlenir
  kategoriSil: async (id) => {
    const kategoriler = get().kategoriler.filter((k) => k.id !== id);

    const atamalar: Record<string, string> = {};
    for (const [yol, kategoriId] of Object.entries(get().atamalar)) {
      if (kategoriId !== id) atamalar[yol] = kategoriId; // Silinen hariç kopyala
    }

    set({ kategoriler, atamalar });
    await diskeKaydet(kategoriler, atamalar);
  },

  // kategoriId = null → dosyanın kategorisini kaldır
  kategoriAta: async (yol, kategoriId) => {
    const atamalar = { ...get().atamalar };
    if (kategoriId === null) {
      delete atamalar[yol];
    } else {
      atamalar[yol] = kategoriId;
    }
    set({ atamalar });
    await diskeKaydet(get().kategoriler, atamalar);
  },

  // Dosya/klasör taşındı veya adı değişti: atama anahtarlarını yeni yola çevir.
  // Klasör taşındıysa içindeki TÜM dosyaların atamaları da taşınır (ön ek değişimi).
  yolGuncelle: async (eskiYol, yeniYol) => {
    const atamalar: Record<string, string> = {};
    for (const [yol, kategoriId] of Object.entries(get().atamalar)) {
      if (yol === eskiYol) {
        atamalar[yeniYol] = kategoriId;
      } else if (yol.startsWith(eskiYol + "/")) {
        atamalar[yeniYol + yol.slice(eskiYol.length)] = kategoriId;
      } else {
        atamalar[yol] = kategoriId;
      }
    }
    set({ atamalar });
    await diskeKaydet(get().kategoriler, atamalar);
  },

  // Dosya/klasör silindi: atamalarını da sil (çöp veri birikmesin)
  yolSil: async (yol) => {
    const atamalar: Record<string, string> = {};
    for (const [mevcut, kategoriId] of Object.entries(get().atamalar)) {
      if (mevcut !== yol && !mevcut.startsWith(yol + "/")) {
        atamalar[mevcut] = kategoriId;
      }
    }
    set({ atamalar });
    await diskeKaydet(get().kategoriler, atamalar);
  },
}));

// ============================================================
// GLOBAL DURUM (Zustand)
// Zustand nedir? React'ta bileşenler arası veri paylaşımı için
// küçük bir kütüphane. Redux'ın çok daha basit hali.
// ============================================================

import { create } from "zustand";
import type { Sekme } from "../types";
import { dosyaOku, dosyaYaz } from "../lib/tauriKoprusu";
import { dosyaAdi, icindeMi } from "../lib/yolYardimcilari";

// ------------------------------------------------------------
// OTOMATİK KAYDETME (debounce — geciktirme)
// ------------------------------------------------------------
// Debounce nedir? Her tuş vuruşunda diske yazmak israf olur.
// Bunun yerine: her değişiklikte 2 saniyelik bir sayaç kurarız.
// Kullanıcı yazmaya devam ederse sayaç sıfırlanır; yazmayı
// bırakınca sayaç dolar ve dosya BİR KEZ kaydedilir.
// Her sekmenin kendi sayacı var (Map: yol → zamanlayıcı numarası).
const otomatikKayitZamanlayicilari = new Map<string, number>();
const OTOMATIK_KAYIT_GECIKMESI_MS = 2000; // 2 saniye

// Depoda tutulacak veriler ve onları değiştiren fonksiyonlar (actions)
interface UygulamaDeposu {
  // --- VERİLER ---
  calismaAlaniYolu: string | null; // Seçili workspace klasörü
  sekmeler: Sekme[];               // Açık tüm sekmeler
  aktifSekmeYolu: string | null;   // Şu an görünen sekmenin yolu

  // --- FONKSİYONLAR ---
  calismaAlaniAyarla: (yol: string) => void;
  dosyaAc: (yol: string, baslik: string) => Promise<void>;
  sekmeKapat: (yol: string) => void;
  aktifSekmeyiDegistir: (yol: string) => void;
  // Faz 4: sekmeleri sürükleyerek sıralama
  sekmeSirasiniDegistir: (kaynakYol: string, hedefYol: string) => void;
  // Faz 5: not dosyasını zengin metin ↔ kod görünümü arasında değiştir
  gorunumModunuDegistir: (yol: string) => void;
  icerikGuncelle: (yol: string, yeniIcerik: string) => void;
  sekmeyiKaydet: (yol: string) => Promise<void>;
  aktifSekmeyiKaydet: () => Promise<void>;
  // Faz 2: dosya yönetimi işlemleri sekmeleri de etkiler
  acikSekmeleriKapat: (silinenYol: string) => void;
  sekmeYollariniTasi: (eskiYol: string, yeniYol: string) => void;
}

export const useUygulamaDeposu = create<UygulamaDeposu>((set, get) => ({
  calismaAlaniYolu: null,
  sekmeler: [],
  aktifSekmeYolu: null,

  // Yeni çalışma alanı seçilince eski sekmeleri temizle
  calismaAlaniAyarla: (yol) =>
    set({ calismaAlaniYolu: yol, sekmeler: [], aktifSekmeYolu: null }),

  // Dosyaya tıklanınca: zaten açıksa o sekmeye geç, değilse diskten oku ve yeni sekme aç
  dosyaAc: async (yol, baslik) => {
    const { sekmeler } = get();

    // Bu dosya zaten açık mı? (yol = benzersiz kimlik)
    const mevcutSekme = sekmeler.find((sekme) => sekme.yol === yol);
    if (mevcutSekme) {
      set({ aktifSekmeYolu: yol }); // Sadece o sekmeye geç
      return;
    }

    // Diskten oku (Rust komutu çalışır)
    const icerik = await dosyaOku(yol);

    const yeniSekme: Sekme = {
      yol,
      baslik,
      icerik,
      kaydedilmemisDegisiklikVar: false,
      kodGorunumu: false, // Not dosyaları varsayılan olarak zengin metinde açılır
    };

    set({
      sekmeler: [...sekmeler, yeniSekme],
      aktifSekmeYolu: yol,
    });
  },

  sekmeKapat: (yol) => {
    const { sekmeler, aktifSekmeYolu } = get();
    const kalanSekmeler = sekmeler.filter((sekme) => sekme.yol !== yol);

    // Kapatılan sekme aktif olandıysa, komşu bir sekmeye geç
    let yeniAktif = aktifSekmeYolu;
    if (aktifSekmeYolu === yol) {
      yeniAktif = kalanSekmeler.length > 0
        ? kalanSekmeler[kalanSekmeler.length - 1].yol
        : null;
    }

    set({ sekmeler: kalanSekmeler, aktifSekmeYolu: yeniAktif });
  },

  aktifSekmeyiDegistir: (yol) => set({ aktifSekmeYolu: yol }),

  // Zengin metin ↔ kod görünümü geçişi (sadece .html/.md sekmeleri kullanır)
  gorunumModunuDegistir: (yol) =>
    set((durum) => ({
      sekmeler: durum.sekmeler.map((sekme) =>
        sekme.yol === yol ? { ...sekme, kodGorunumu: !sekme.kodGorunumu } : sekme
      ),
    })),

  // Sürüklenen sekmeyi (kaynak), bırakıldığı sekmenin (hedef) yerine taşı.
  // splice: diziden eleman çıkarma/ekleme — önce kaynağı çıkar,
  // sonra hedefin konumuna sok. Kalan sekmeler sağa kayar.
  sekmeSirasiniDegistir: (kaynakYol, hedefYol) =>
    set((durum) => {
      const sekmeler = [...durum.sekmeler]; // Kopya al (state doğrudan değiştirilmez!)
      const kaynakIndeks = sekmeler.findIndex((s) => s.yol === kaynakYol);
      const hedefIndeks = sekmeler.findIndex((s) => s.yol === hedefYol);
      if (kaynakIndeks === -1 || hedefIndeks === -1) return {}; // Bulunamadı — dokunma

      const [tasinanSekme] = sekmeler.splice(kaynakIndeks, 1);
      sekmeler.splice(hedefIndeks, 0, tasinanSekme);
      return { sekmeler };
    }),

  // Editörde her değişiklikte çağrılır: içeriği güncelle + "kirli" işaretle
  // + otomatik kaydetme sayacını (yeniden) kur
  icerikGuncelle: (yol, yeniIcerik) => {
    set((durum) => ({
      sekmeler: durum.sekmeler.map((sekme) =>
        sekme.yol === yol
          ? { ...sekme, icerik: yeniIcerik, kaydedilmemisDegisiklikVar: true }
          : sekme
      ),
    }));

    // Bu sekme için kurulu eski sayacı iptal et (debounce'un özü budur:
    // kullanıcı hâlâ yazıyorsa bekleme süresi baştan başlar)
    const eskiZamanlayici = otomatikKayitZamanlayicilari.get(yol);
    if (eskiZamanlayici !== undefined) clearTimeout(eskiZamanlayici);

    // 2 saniye sonra bu sekmeyi kaydet
    const yeniZamanlayici = window.setTimeout(() => {
      otomatikKayitZamanlayicilari.delete(yol);
      get().sekmeyiKaydet(yol);
    }, OTOMATIK_KAYIT_GECIKMESI_MS);
    otomatikKayitZamanlayicilari.set(yol, yeniZamanlayici);
  },

  // Belirli bir sekmeyi diske yaz, "kirli" işaretini kaldır.
  // Hem otomatik kaydetme hem Cmd/Ctrl+S bunu kullanır.
  sekmeyiKaydet: async (yol) => {
    const sekme = get().sekmeler.find((s) => s.yol === yol);
    // Sekme kapatılmış/taşınmış ya da zaten kayıtlıysa bir şey yapma
    if (!sekme || !sekme.kaydedilmemisDegisiklikVar) return;

    await dosyaYaz(sekme.yol, sekme.icerik); // Rust'a gönder

    set((durum) => ({
      sekmeler: durum.sekmeler.map((s) =>
        s.yol === yol ? { ...s, kaydedilmemisDegisiklikVar: false } : s
      ),
    }));
  },

  // Cmd/Ctrl+S: aktif sekmeyi hemen kaydet (2 saniye beklemeden)
  aktifSekmeyiKaydet: async () => {
    const { aktifSekmeYolu } = get();
    if (aktifSekmeYolu) await get().sekmeyiKaydet(aktifSekmeYolu);
  },

  // Bir dosya/klasör SİLİNDİĞİNDE: o yola ait açık sekmeleri kapat.
  // Klasör silindiyse içindeki tüm dosyaların sekmeleri de kapanmalı —
  // icindeMi() bu yüzden "yol VEYA altındaki her şey" kontrolü yapar.
  acikSekmeleriKapat: (silinenYol) =>
    set((durum) => {
      const kalanSekmeler = durum.sekmeler.filter(
        (sekme) => !icindeMi(sekme.yol, silinenYol)
      );

      // Aktif sekme de kapandıysa kalanların sonuncusuna geç
      const aktifHalaAcik = kalanSekmeler.some(
        (sekme) => sekme.yol === durum.aktifSekmeYolu
      );

      return {
        sekmeler: kalanSekmeler,
        aktifSekmeYolu: aktifHalaAcik
          ? durum.aktifSekmeYolu
          : kalanSekmeler[kalanSekmeler.length - 1]?.yol ?? null,
      };
    }),

  // Bir dosya/klasör TAŞINDIĞINDA veya YENİDEN ADLANDIRILDIĞINDA:
  // açık sekmelerin yollarını (ve başlıklarını) yeni yola göre düzelt.
  // Yoksa sekme eski (artık var olmayan) yolu gösterir ve kaydetme patlar.
  sekmeYollariniTasi: (eskiYol, yeniYol) => {
    // Tek bir yolu dönüştüren yardımcı: birebir eşleşme veya alt yol
    const yoluDonustur = (yol: string): string => {
      if (yol === eskiYol) return yeniYol;
      if (yol.startsWith(eskiYol + "/")) {
        return yeniYol + yol.slice(eskiYol.length); // Ön eki değiştir
      }
      return yol; // İlgisiz sekme — dokunma
    };

    set((durum) => ({
      sekmeler: durum.sekmeler.map((sekme) => {
        const yeniSekmeYolu = yoluDonustur(sekme.yol);
        if (yeniSekmeYolu === sekme.yol) return sekme; // Değişmedi
        return {
          ...sekme,
          yol: yeniSekmeYolu,
          baslik: dosyaAdi(yeniSekmeYolu), // Yeniden adlandırmada başlık da değişir
        };
      }),
      aktifSekmeYolu: durum.aktifSekmeYolu
        ? yoluDonustur(durum.aktifSekmeYolu)
        : null,
    }));
  },
}));

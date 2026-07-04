// ============================================================
// SÜRÜKLE-BIRAK TAŞIMA MANTIĞI
// Gezginde bir öğe bir klasörün üstüne bırakılınca burası çalışır.
//
// Neden bileşenin içinde değil? Aynı mantık hem AgacDugumu'nda
// (klasöre bırakma) hem FileExplorer'da (kök alana bırakma) lazım.
//
// Not: Zustand depolarına bileşen DIŞINDAN .getState() ile
// erişilebilir — hook kuralı sadece bileşen içleri için geçerlidir.
// ============================================================

import { yenidenAdlandir } from "./tauriKoprusu";
import { dosyaAdi, icindeMi, ustKlasor, yolBirlestir } from "./yolYardimcilari";
import { useUygulamaDeposu } from "../store/uygulamaDeposu";
import { useGezginDeposu } from "../store/gezginDeposu";
import { useKategoriDeposu } from "../store/kategoriDeposu";

// Bir dosya/klasörü hedef klasörün içine taşır.
// Taşıma aslında "yeniden adlandırma"dır: /a/not.html → /b/not.html
export async function dosyaTasi(kaynakYol: string, hedefKlasor: string): Promise<void> {
  const gezgin = useGezginDeposu.getState();

  // Kural 1: Zaten aynı klasördeyse yapılacak bir şey yok
  if (ustKlasor(kaynakYol) === hedefKlasor) return;

  // Kural 2: Bir klasör kendi içine (veya alt klasörüne) taşınamaz —
  // bu sonsuz döngü gibi imkânsız bir durum yaratır, dosya sistemi reddeder
  if (icindeMi(hedefKlasor, kaynakYol)) {
    gezgin.hataGoster("Bir klasör kendi içine taşınamaz.");
    return;
  }

  const yeniYol = yolBirlestir(hedefKlasor, dosyaAdi(kaynakYol));

  try {
    await yenidenAdlandir(kaynakYol, yeniYol); // Rust tarafı taşımayı yapar

    // Taşınan dosya açık bir sekmedeyse sekmenin yolunu da güncelle
    useUygulamaDeposu.getState().sekmeYollariniTasi(kaynakYol, yeniYol);

    // Kategori ataması da yeni yolu izlesin
    await useKategoriDeposu.getState().yolGuncelle(kaynakYol, yeniYol);

    gezgin.agaciYenile(); // Ağaç görünümünü tazele
  } catch (hata) {
    gezgin.hataGoster(String(hata)); // Örn: "Hedef isimde bir dosya zaten var."
  }
}

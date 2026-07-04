// ============================================================
// GEZGİN MODALLARI — sağ tık menüsünden açılan pencerelerin beyni
// Hangi modal açıksa onu çizer ve onaylanınca ilgili Rust komutunu çağırır.
//
// İş akışı: Sağ tık → menü → modalAc(...) → bu bileşen modalı çizer
// → kullanıcı onaylar → köprü fonksiyonu çalışır → ağaç yenilenir.
// ============================================================

import { useState } from "react";
import { useGezginDeposu } from "../../store/gezginDeposu";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";
import {
  sil,
  yeniDosyaOlustur,
  yeniKlasorOlustur,
  yenidenAdlandir,
} from "../../lib/tauriKoprusu";
import { ustKlasor, yolBirlestir } from "../../lib/yolYardimcilari";
import { useKategoriDeposu } from "../../store/kategoriDeposu";
import { GirdiModali } from "../Modallar/GirdiModali";
import { OnayModali } from "../Modallar/OnayModali";
import { KategoriAtaModali } from "../Modallar/KategoriAtaModali";
import { KategoriYonetimiModali } from "../Modallar/KategoriYonetimiModali";

export function GezginModallari() {
  const modal = useGezginDeposu((d) => d.modal);
  const modalKapat = useGezginDeposu((d) => d.modalKapat);
  const agaciYenile = useGezginDeposu((d) => d.agaciYenile);
  const acikSekmeleriKapat = useUygulamaDeposu((d) => d.acikSekmeleriKapat);
  const sekmeYollariniTasi = useUygulamaDeposu((d) => d.sekmeYollariniTasi);

  // İşlem başarısız olursa mesajı modalın içinde gösteririz
  const [hata, setHata] = useState<string | null>(null);

  if (!modal) return null;

  // Modal kapanırken eski hata mesajı da temizlensin
  const kapat = () => {
    setHata(null);
    modalKapat();
  };

  // Ortak yardımcı: verilen asenkron işlemi dene; başarılıysa
  // modalı kapat ve ağacı yenile, hata varsa modalda göster
  const calistir = async (islem: () => Promise<void>) => {
    try {
      await islem();
      kapat();
      agaciYenile();
    } catch (hataNesnesi) {
      setHata(String(hataNesnesi));
    }
  };

  switch (modal.tur) {
    case "yeniDosya":
      return (
        <GirdiModali
          baslik="Yeni Dosya"
          aciklama="Dosya adını yazın. Uzantı yazmazsanız .html eklenir."
          baslangicDegeri="yeni-not.html"
          onaylaMetni="Oluştur"
          hata={hata}
          iptal={kapat}
          onayla={(isim) =>
            calistir(async () => {
              // Uzantısız isme .html ekle — notlar HTML olarak kaydediliyor
              const tamIsim = isim.includes(".") ? isim : `${isim}.html`;
              await yeniDosyaOlustur(yolBirlestir(modal.hedefKlasor, tamIsim));
            })
          }
        />
      );

    case "yeniKlasor":
      return (
        <GirdiModali
          baslik="Yeni Klasör"
          aciklama="Klasör adını yazın."
          baslangicDegeri="yeni-klasor"
          onaylaMetni="Oluştur"
          hata={hata}
          iptal={kapat}
          onayla={(isim) =>
            calistir(async () => {
              await yeniKlasorOlustur(yolBirlestir(modal.hedefKlasor, isim));
            })
          }
        />
      );

    case "yenidenAdlandir":
      return (
        <GirdiModali
          baslik="Yeniden Adlandır"
          aciklama={`"${modal.hedef.isim}" için yeni bir isim yazın.`}
          baslangicDegeri={modal.hedef.isim}
          onaylaMetni="Adlandır"
          hata={hata}
          iptal={kapat}
          onayla={(yeniIsim) =>
            calistir(async () => {
              // Yeni yol = aynı klasör + yeni isim
              const yeniYol = yolBirlestir(ustKlasor(modal.hedef.yol), yeniIsim);
              await yenidenAdlandir(modal.hedef.yol, yeniYol);
              // Açık sekmelerin yolu/başlığı da değişsin
              sekmeYollariniTasi(modal.hedef.yol, yeniYol);
              // Kategori ataması da yeni yolu izlesin
              await useKategoriDeposu.getState().yolGuncelle(modal.hedef.yol, yeniYol);
            })
          }
        />
      );

    case "sil":
      return (
        <OnayModali
          baslik={modal.hedef.klasorMu ? "Klasörü Sil" : "Dosyayı Sil"}
          mesaj={`"${modal.hedef.isim}" Geri Dönüşüm Kutusu'na taşınacak. Emin misiniz?`}
          onaylaMetni="Sil"
          hata={hata}
          iptal={kapat}
          onayla={() =>
            calistir(async () => {
              await sil(modal.hedef.yol);
              // Silinen dosyanın (veya klasördeki dosyaların) sekmelerini kapat
              acikSekmeleriKapat(modal.hedef.yol);
              // Kategori atamasını da temizle
              await useKategoriDeposu.getState().yolSil(modal.hedef.yol);
            })
          }
        />
      );

    case "kategoriAta":
      return <KategoriAtaModali hedef={modal.hedef} kapat={kapat} />;

    case "kategoriYonetimi":
      return <KategoriYonetimiModali kapat={kapat} />;
  }
}

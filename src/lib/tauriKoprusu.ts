// ============================================================
// TAURI KÖPRÜSÜ
// Rust backend'deki komutları çağıran fonksiyonlar.
// invoke("komut_adi", { parametreler }) → Rust fonksiyonunu çalıştırır
// Bileşenler asla doğrudan invoke çağırmaz — hep bu dosyayı kullanır.
// ============================================================

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import type { AramaSonucu, DosyaDugumu } from "../types";

// ------------------------------------------------------------
// KALICI AYARLAR (tauri-plugin-store)
// ------------------------------------------------------------
// "Store" eklentisi ayarları diskte bir JSON dosyasında saklar
// (uygulamanın kendi ayar klasöründe). Uygulama kapanıp açılınca
// ayarlar kaybolmaz — son çalışma alanını hatırlamak için kullanıyoruz.
const AYAR_DOSYASI = "ayarlar.json";
const SON_CALISMA_ALANI_ANAHTARI = "sonCalismaAlani";

// Seçilen çalışma alanını ayar dosyasına yaz (bir dahaki açılış için)
async function sonCalismaAlaniniKaydet(yol: string): Promise<void> {
  const ayarlar = await load(AYAR_DOSYASI); // Dosya yoksa oluşturur
  await ayarlar.set(SON_CALISMA_ALANI_ANAHTARI, yol);
  await ayarlar.save(); // Diske hemen yaz
}

// Uygulama açılışında: kayıtlı çalışma alanı varsa Rust state'ine
// yükle ve yolunu döndür. Yoksa (veya klasör silinmişse) null döner.
export async function kayitliCalismaAlaniniYukle(): Promise<string | null> {
  try {
    const ayarlar = await load(AYAR_DOSYASI);
    const yol = await ayarlar.get<string>(SON_CALISMA_ALANI_ANAHTARI);
    if (!yol) return null;

    // Rust tarafı klasörün hâlâ var olduğunu da kontrol eder;
    // klasör silinmişse hata döner ve catch'e düşeriz.
    await invoke("calisma_alani_ayarla", { yol });
    return yol;
  } catch {
    return null; // Kayıt yok ya da klasör artık mevcut değil — sessizce geç
  }
}

// ------------------------------------------------------------
// Çalışma alanı seçtir: yerel "klasör seç" penceresini açar
// ------------------------------------------------------------
// Dönen değer: seçilen klasörün yolu, ya da kullanıcı iptal ettiyse null
export async function calismaAlaniSec(): Promise<string | null> {
  // open() işletim sisteminin KENDİ klasör seçme penceresini açar
  const secilenYol = await open({
    directory: true,          // Dosya değil, klasör seçtir
    multiple: false,          // Tek klasör
    title: "Çalışma Alanı Seç",
  });

  if (typeof secilenYol !== "string") {
    return null; // Kullanıcı pencereyi iptal etti
  }

  // Seçilen yolu Rust tarafındaki state'e kaydet
  await invoke("calisma_alani_ayarla", { yol: secilenYol });

  // Bir dahaki açılışta hatırlamak için diske de yaz
  await sonCalismaAlaniniKaydet(secilenYol);
  return secilenYol;
}

// ------------------------------------------------------------
// Klasör içeriğini listele (dosya gezgini için)
// ------------------------------------------------------------
export async function klasorIceriginiListele(yol: string): Promise<DosyaDugumu[]> {
  return invoke<DosyaDugumu[]>("klasor_icerigini_listele", { yol });
}

// ------------------------------------------------------------
// Dosya oku / yaz
// ------------------------------------------------------------
export async function dosyaOku(yol: string): Promise<string> {
  return invoke<string>("dosya_oku", { yol });
}

export async function dosyaYaz(yol: string, icerik: string): Promise<void> {
  return invoke("dosya_yaz", { yol, icerik });
}

// ------------------------------------------------------------
// Oluşturma / silme / yeniden adlandırma
// ------------------------------------------------------------
export async function yeniDosyaOlustur(yol: string): Promise<void> {
  return invoke("yeni_dosya_olustur", { yol });
}

export async function yeniKlasorOlustur(yol: string): Promise<void> {
  return invoke("yeni_klasor_olustur", { yol });
}

export async function sil(yol: string): Promise<void> {
  return invoke("sil", { yol });
}

export async function yenidenAdlandir(eskiYol: string, yeniYol: string): Promise<void> {
  // Dikkat: Rust'ta parametre adı eski_yol (snake_case) ama
  // invoke çağrısında eskiYol (camelCase) gönderilir — Tauri çevirir.
  return invoke("yeniden_adlandir", { eskiYol, yeniYol });
}

// ------------------------------------------------------------
// Arama: tüm çalışma alanında dosya adı + içerik araması (Rust yapar)
// ------------------------------------------------------------
export async function calismaAlanindaAra(sorgu: string): Promise<AramaSonucu[]> {
  return invoke<AramaSonucu[]>("calisma_alaninda_ara", { sorgu });
}

// ============================================================
// ARAMA KOMUTU
// Tüm çalışma alanında dosya adı VE dosya içeriği araması yapar.
//
// Neden Rust tarafında? Binlerce dosyayı okuyup taramak ağır iştir;
// JavaScript'te yapılsa arayüz donardı. Rust bunu çok hızlı yapar
// ve arayüz akıcı kalır.
// ============================================================

use crate::state::UygulamaDurumu;
use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::State;

// Sonuç sayısı sınırı: "e" gibi tek harf aramak binlerce sonuç
// döndürebilir — hem arayüzü hem belleği korumak için üst sınır koyduk.
const SONUC_LIMITI: usize = 200;

// 1 MB'tan büyük dosyaların içine bakmıyoruz (görsel gömülü dev notlar,
// yanlışlıkla çalışma alanına konmuş büyük dosyalar vb. aramayı yavaşlatmasın)
const MAKS_DOSYA_BOYUTU: u64 = 1_000_000;

// Tek bir arama sonucu satırı
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AramaSonucu {
    pub yol: String,        // Dosyanın tam yolu (tıklayınca açmak için)
    pub isim: String,       // Dosya adı
    pub satir_no: usize,    // Eşleşen satır numarası (0 = dosya ADI eşleşti)
    pub satir_ozeti: String, // Eşleşen satırın kısaltılmış hali
}

// ------------------------------------------------------------
// KOMUT: Çalışma alanında ara
// ------------------------------------------------------------
#[tauri::command]
pub fn calisma_alaninda_ara(
    sorgu: String,
    durum: State<UygulamaDurumu>,
) -> Result<Vec<AramaSonucu>, String> {
    // Aramayı harf büyüklüğüne DUYARSIZ yapıyoruz ("Not" araması "not"u da bulsun)
    let sorgu = sorgu.trim().to_lowercase();
    if sorgu.is_empty() {
        return Ok(Vec::new());
    }

    // Çalışma alanı yolunu al (kilidi hemen bırakmak için ayrı blok —
    // arama uzun sürebilir, kilit o sırada tutulmamalı)
    let kok_klasor = {
        let kilit = durum.calisma_alani.lock().map_err(|e| e.to_string())?;
        kilit
            .as_ref()
            .ok_or("Önce bir çalışma alanı seçmelisiniz.")?
            .clone()
    };

    let mut sonuclar = Vec::new();
    klasorde_ara(&kok_klasor, &sorgu, &mut sonuclar);
    Ok(sonuclar)
}

// Özyinelemeli (recursive) arama: klasörü gez, alt klasörlere de dal
fn klasorde_ara(klasor: &Path, sorgu: &str, sonuclar: &mut Vec<AramaSonucu>) {
    if sonuclar.len() >= SONUC_LIMITI {
        return; // Limit doldu — daha derine inmeye gerek yok
    }

    let girdiler = match fs::read_dir(klasor) {
        Ok(girdiler) => girdiler,
        Err(_) => return, // Okunamayan klasörü sessizce atla (izin sorunu vb.)
    };

    for girdi in girdiler.flatten() {
        if sonuclar.len() >= SONUC_LIMITI {
            return;
        }

        let yol = girdi.path();
        let isim = girdi.file_name().to_string_lossy().to_string();

        // Gizli dosya/klasörleri atla (.git, .DS_Store...)
        if isim.starts_with('.') {
            continue;
        }

        if yol.is_dir() {
            klasorde_ara(&yol, sorgu, sonuclar); // Özyineleme: alt klasöre dal
            continue;
        }

        let yol_metni = yol.to_string_lossy().to_string();

        // 1) DOSYA ADI eşleşmesi (satir_no = 0 bunun işareti)
        if isim.to_lowercase().contains(sorgu) {
            sonuclar.push(AramaSonucu {
                yol: yol_metni.clone(),
                isim: isim.clone(),
                satir_no: 0,
                satir_ozeti: String::new(),
            });
        }

        // 2) DOSYA İÇERİĞİ eşleşmesi
        // Büyük dosyaları atla
        if let Ok(meta) = yol.metadata() {
            if meta.len() > MAKS_DOSYA_BOYUTU {
                continue;
            }
        }

        // Metin olmayan dosyalar (görsel vb.) read_to_string'de hata verir — atla
        let icerik = match fs::read_to_string(&yol) {
            Ok(icerik) => icerik,
            Err(_) => continue,
        };

        for (indeks, satir) in icerik.lines().enumerate() {
            if satir.to_lowercase().contains(sorgu) {
                sonuclar.push(AramaSonucu {
                    yol: yol_metni.clone(),
                    isim: isim.clone(),
                    satir_no: indeks + 1, // İnsanlar 1'den saymaya alışkın
                    satir_ozeti: satiri_ozetle(satir),
                });
                if sonuclar.len() >= SONUC_LIMITI {
                    return;
                }
            }
        }
    }
}

// Uzun satırları kısalt — arayüzde tek satırlık özet yeter.
// .chars() kullanıyoruz çünkü Türkçe karakterler (ç, ğ, ş...) birden
// fazla bayt kaplar; bayt ortasından kesmek programı çökertir.
fn satiri_ozetle(satir: &str) -> String {
    satir.trim().chars().take(100).collect()
}

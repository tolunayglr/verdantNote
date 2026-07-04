// ============================================================
// DOSYA SİSTEMİ KOMUTLARI
// Frontend'in invoke() ile çağırabildiği tüm fonksiyonlar burada.
// #[tauri::command] etiketi, fonksiyonu IPC köprüsüne açar.
// ============================================================

use crate::state::UygulamaDurumu;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;

// ------------------------------------------------------------
// VERİ YAPISI: Dosya ağacındaki tek bir düğüm (dosya veya klasör)
// ------------------------------------------------------------
// #[derive(Serialize)]: Bu yapı otomatik olarak JSON'a çevrilebilir olsun.
// rename_all = "camelCase": Rust'ta snake_case (klasor_mu) kullanılır,
// JavaScript'te camelCase (klasorMu). Bu satır çeviriyi otomatik yapar.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DosyaDugumu {
    pub isim: String,    // Örn: "notlarim.md"
    pub yol: String,     // Tam yol: "/Users/m2/Notlar/notlarim.md"
    pub klasor_mu: bool, // true = klasör, false = dosya
    pub metin_mi: bool,  // true = editörde açılabilir metin dosyası
}

// ------------------------------------------------------------
// METİN DOSYASI ALGILAMA
// ------------------------------------------------------------
// Uzantısı bilinen metin türlerinden biriyse direkt kabul.
// Bilinen İKİLİ (binary) türlerdense direkt ret — içine bakmaya gerek yok.
// İkisi de değilse (örn: .data, .log2) dosyanın İÇİNE bakarız (koklama).

// Kesin metin kabul edilen uzantılar (web, programlama, betik, yapılandırma)
const METIN_UZANTILARI: &[&str] = &[
    // Web ve işaretleme
    "html", "htm", "xhtml", "css", "js", "mjs", "ts", "jsx", "tsx",
    "json", "xml", "yaml", "yml", "svg",
    // Programlama dilleri
    "c", "cpp", "cc", "h", "hpp", "cs", "java", "py", "php",
    "rs", "rb", "go", "swift", "kt",
    // Metin ve not
    "txt", "log", "md", "markdown", "csv",
    // Yapılandırma ve betik
    "ini", "inf", "cfg", "conf", "env", "props", "toml",
    "bat", "cmd", "sh", "ps1", "sql", "makefile",
];

// Kesin ikili (binary) kabul edilen uzantılar — koklamaya gerek yok
const IKILI_UZANTILAR: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "webp", "ico", "icns", "bmp",
    "pdf", "zip", "rar", "7z", "tar", "gz", "dmg", "iso",
    "exe", "dll", "so", "dylib", "class", "o", "a",
    "mp3", "mp4", "mov", "avi", "wav", "flac",
    "woff", "woff2", "ttf", "otf", "eot", "db", "sqlite",
];

fn metin_dosyasi_mi(yol: &Path) -> bool {
    if let Some(uzanti) = yol.extension().and_then(|u| u.to_str()) {
        let uzanti = uzanti.to_lowercase();
        if METIN_UZANTILARI.contains(&uzanti.as_str()) {
            return true;
        }
        if IKILI_UZANTILAR.contains(&uzanti.as_str()) {
            return false;
        }
    }
    // Uzantı tanıdık değil (veya hiç yok) → içeriğe bakarak karar ver
    icerik_metin_mi(yol)
}

// "Koklama" (sniffing): dosyanın ilk 1024 baytını oku.
// İçinde NUL baytı (0x00) varsa ikili dosyadır — metin dosyalarında
// NUL bulunmaz. Basit ama şaşırtıcı derecede isabetli bir yöntem;
// aynı tekniği git de kullanır.
fn icerik_metin_mi(yol: &Path) -> bool {
    use std::io::Read;

    let mut dosya = match fs::File::open(yol) {
        Ok(dosya) => dosya,
        Err(_) => return false, // Açılamıyorsa açılabilir diye gösterme
    };

    let mut tampon = [0u8; 1024];
    let okunan_bayt = match dosya.read(&mut tampon) {
        Ok(sayi) => sayi,
        Err(_) => return false,
    };

    if okunan_bayt == 0 {
        return true; // Boş dosya metin sayılır (yeni oluşturulmuş olabilir)
    }

    !tampon[..okunan_bayt].contains(&0)
}

// ------------------------------------------------------------
// GÜVENLİK KONTROLÜ (çok önemli!)
// ------------------------------------------------------------
// Frontend'den gelen her yolun, seçili çalışma alanının İÇİNDE
// olduğunu doğrular. Böylece kötü niyetli veya hatalı bir istek
// (örn: "../../etc/passwd" gibi "path traversal" saldırısı)
// çalışma alanı dışına çıkamaz.
fn yol_guvenli_mi(durum: &State<UygulamaDurumu>, yol: &str) -> Result<PathBuf, String> {
    // 1. Kayıtlı çalışma alanını al
    let kilit = durum.calisma_alani.lock().map_err(|e| e.to_string())?;
    let calisma_alani = kilit
        .as_ref()
        .ok_or("Önce bir çalışma alanı seçmelisiniz.")?;

    // 2. Gelen yolu "normalize" et (canonicalize: ../ gibi kısaltmaları çözer)
    let hedef = Path::new(yol);
    let normalize_yol = if hedef.exists() {
        hedef
            .canonicalize()
            .map_err(|e| format!("Yol çözümlenemedi: {}", e))?
    } else {
        // Henüz var olmayan dosyalar (yeni oluşturulacaklar) için
        // üst klasörünü kontrol ediyoruz
        let ust = hedef.parent().ok_or("Geçersiz yol.")?;
        ust.canonicalize()
            .map_err(|e| format!("Üst klasör bulunamadı: {}", e))?
            .join(hedef.file_name().ok_or("Geçersiz dosya adı.")?)
    };

    // 3. Yol, çalışma alanı ile başlıyor mu? Başlamıyorsa REDDET.
    if !normalize_yol.starts_with(calisma_alani) {
        return Err("Güvenlik hatası: Çalışma alanı dışına erişim engellendi.".into());
    }

    Ok(normalize_yol)
}

// ------------------------------------------------------------
// KOMUT 1: Çalışma alanını ayarla
// ------------------------------------------------------------
// Klasör seçme penceresi frontend'de dialog eklentisi ile açılır,
// seçilen yol buraya gönderilip state'e kaydedilir.
#[tauri::command]
pub fn calisma_alani_ayarla(yol: String, durum: State<UygulamaDurumu>) -> Result<(), String> {
    let klasor = PathBuf::from(&yol);

    // Gerçekten var olan bir klasör mü kontrol et
    if !klasor.is_dir() {
        return Err("Seçilen yol geçerli bir klasör değil.".into());
    }

    // canonicalize: yolu mutlak ve temiz hale getir
    let temiz_yol = klasor.canonicalize().map_err(|e| e.to_string())?;

    // Mutex kilidini al ve yeni değeri yaz
    let mut kilit = durum.calisma_alani.lock().map_err(|e| e.to_string())?;
    *kilit = Some(temiz_yol);

    Ok(())
}

// ------------------------------------------------------------
// KOMUT 2: Bir klasörün içeriğini listele (TEK SEVİYE)
// ------------------------------------------------------------
// Neden tek seviye, neden tüm ağaç değil?
// Büyük klasörlerde (binlerce dosya) tüm ağacı bir kerede okumak
// uygulamayı dondurur. Bunun yerine "lazy loading" (tembel yükleme)
// yapıyoruz: kullanıcı klasöre tıklayınca sadece o klasörün içi okunur.
#[tauri::command]
pub fn klasor_icerigini_listele(
    yol: String,
    durum: State<UygulamaDurumu>,
) -> Result<Vec<DosyaDugumu>, String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    let mut dugumler: Vec<DosyaDugumu> = Vec::new();

    // Klasördeki her öğeyi gez
    let girdiler = fs::read_dir(&guvenli_yol).map_err(|e| format!("Klasör okunamadı: {}", e))?;

    for girdi in girdiler {
        let girdi = girdi.map_err(|e| e.to_string())?;
        let dosya_yolu = girdi.path();
        let isim = girdi.file_name().to_string_lossy().to_string();

        // Gizli dosyaları atla (.git, .DS_Store gibi nokta ile başlayanlar)
        if isim.starts_with('.') {
            continue;
        }

        let klasor_mu = dosya_yolu.is_dir();
        dugumler.push(DosyaDugumu {
            isim,
            yol: dosya_yolu.to_string_lossy().to_string(),
            klasor_mu,
            // Klasörler için anlamsız ama true bırakıyoruz (tıklanabilirler)
            metin_mi: klasor_mu || metin_dosyasi_mi(&dosya_yolu),
        });
    }

    // Sıralama: önce klasörler, sonra dosyalar; kendi içinde alfabetik
    // (Notepad++ ve VSCode da böyle yapar)
    dugumler.sort_by(|a, b| {
        b.klasor_mu
            .cmp(&a.klasor_mu)
            .then(a.isim.to_lowercase().cmp(&b.isim.to_lowercase()))
    });

    Ok(dugumler)
}

// ------------------------------------------------------------
// KOMUT 3: Dosya içeriğini oku
// ------------------------------------------------------------
#[tauri::command]
pub fn dosya_oku(yol: String, durum: State<UygulamaDurumu>) -> Result<String, String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    fs::read_to_string(&guvenli_yol).map_err(|e| format!("Dosya okunamadı: {}", e))
}

// ------------------------------------------------------------
// KOMUT 4: Dosyaya yaz (kaydet)
// ------------------------------------------------------------
#[tauri::command]
pub fn dosya_yaz(yol: String, icerik: String, durum: State<UygulamaDurumu>) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    fs::write(&guvenli_yol, icerik).map_err(|e| format!("Dosya kaydedilemedi: {}", e))
}

// ------------------------------------------------------------
// KOMUT 5: Yeni dosya oluştur
// ------------------------------------------------------------
#[tauri::command]
pub fn yeni_dosya_olustur(yol: String, durum: State<UygulamaDurumu>) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    // Aynı isimde dosya varsa üzerine yazmayı ENGELLE
    if guvenli_yol.exists() {
        return Err("Bu isimde bir dosya zaten var.".into());
    }

    fs::write(&guvenli_yol, "").map_err(|e| format!("Dosya oluşturulamadı: {}", e))
}

// ------------------------------------------------------------
// KOMUT 6: Yeni klasör oluştur
// ------------------------------------------------------------
#[tauri::command]
pub fn yeni_klasor_olustur(yol: String, durum: State<UygulamaDurumu>) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    if guvenli_yol.exists() {
        return Err("Bu isimde bir klasör zaten var.".into());
    }

    fs::create_dir(&guvenli_yol).map_err(|e| format!("Klasör oluşturulamadı: {}", e))
}

// ------------------------------------------------------------
// KOMUT 7: Sil (Geri Dönüşüm Kutusu'na taşı)
// ------------------------------------------------------------
// Neden fs::remove_file değil? Kalıcı silme geri alınamaz.
// "trash" kütüphanesi macOS'ta Çöp Sepeti'ne, Windows'ta
// Geri Dönüşüm Kutusu'na taşır — kullanıcı hatası affedilebilir olur.
#[tauri::command]
pub fn sil(yol: String, durum: State<UygulamaDurumu>) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    cope_tasi(&guvenli_yol).map_err(|e| format!("Silinemedi: {}", e))
}

// macOS'a özel silme yolu:
// "trash" kütüphanesi macOS'ta varsayılan olarak Finder'a AppleScript
// komutu gönderir. Ama iCloud Drive ile eşitlenen klasörlerde (Masaüstü
// gibi) Finder "öğenin indirilmesi gerekiyor" (-8013) hatası veriyor.
// NSFileManager (macOS'un kendi dosya API'si) bu sorunu yaşamaz.
// Tek fark: Çöp Sepeti'ndeki "Geri Koy" düğmesi çalışmaz — dosya yine
// çöpe gider ve elle geri alınabilir.
#[cfg(target_os = "macos")]
fn cope_tasi(yol: &Path) -> Result<(), trash::Error> {
    use trash::macos::{DeleteMethod, TrashContextExtMacos};

    let mut baglam = trash::TrashContext::default();
    baglam.set_delete_method(DeleteMethod::NsFileManager);
    baglam.delete(yol)
}

// macOS dışındaki sistemlerde (Windows/Linux) varsayılan yöntem sorunsuz.
// #[cfg(...)]: koşullu derleme — bu fonksiyonun hangi kopyası derleneceği
// hedef işletim sistemine göre seçilir.
#[cfg(not(target_os = "macos"))]
fn cope_tasi(yol: &Path) -> Result<(), trash::Error> {
    trash::delete(yol)
}

// ------------------------------------------------------------
// KOMUT 8: Yeniden adlandır / taşı
// ------------------------------------------------------------
#[tauri::command]
pub fn yeniden_adlandir(
    eski_yol: String,
    yeni_yol: String,
    durum: State<UygulamaDurumu>,
) -> Result<(), String> {
    let guvenli_eski = yol_guvenli_mi(&durum, &eski_yol)?;
    let guvenli_yeni = yol_guvenli_mi(&durum, &yeni_yol)?;

    if guvenli_yeni.exists() {
        return Err("Hedef isimde bir dosya zaten var.".into());
    }

    fs::rename(&guvenli_eski, &guvenli_yeni).map_err(|e| format!("Yeniden adlandırılamadı: {}", e))
}

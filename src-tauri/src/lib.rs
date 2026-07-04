// Uygulamanın kurulum merkezi.
// Yazdığımız her komut, invoke_handler listesine EKLENMEK ZORUNDA —
// eklemeyi unutursan frontend "command not found" hatası alır.

mod commands;
mod state;

use commands::{arama, dosya_islemleri};
use state::UygulamaDurumu;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        // Dialog eklentisi: klasör seçme penceresi için
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        // Uygulama durumunu (state) sisteme tanıt
        .manage(UygulamaDurumu::yeni())
        // Frontend'in çağırabileceği komutların TAM listesi
        .invoke_handler(tauri::generate_handler![
            dosya_islemleri::calisma_alani_ayarla,
            dosya_islemleri::klasor_icerigini_listele,
            dosya_islemleri::dosya_oku,
            dosya_islemleri::dosya_yaz,
            dosya_islemleri::yeni_dosya_olustur,
            dosya_islemleri::yeni_klasor_olustur,
            dosya_islemleri::sil,
            dosya_islemleri::yeniden_adlandir,
            arama::calisma_alaninda_ara,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri uygulaması başlatılamadı");
}

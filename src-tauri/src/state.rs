// Uygulama genelinde paylaşılan durum (state).
// Kullanıcının seçtiği "Çalışma Alanı" (Workspace) klasörünü burada tutuyoruz.
//
// Mutex nedir? "Mutual Exclusion" = karşılıklı dışlama.
// Aynı anda iki komut bu veriye yazmaya çalışırsa çakışma olmasın diye kilit mekanizması.

use std::path::PathBuf;
use std::sync::Mutex;

pub struct UygulamaDurumu {
    // Option<PathBuf>: "belki bir yol var, belki yok" demek.
    // Uygulama ilk açıldığında henüz çalışma alanı seçilmemiştir (None).
    pub calisma_alani: Mutex<Option<PathBuf>>,
}

impl UygulamaDurumu {
    pub fn yeni() -> Self {
        Self {
            calisma_alani: Mutex::new(None),
        }
    }
}

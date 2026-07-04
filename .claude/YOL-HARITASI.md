# 📝 NoteAppTG — Detaylı Yol Haritası ve Kod Mimarisi Rehberi

> **Konsept:** Evernote'un zengin metin editörü + Notepad++'ın dosya gezgini ve sekme sistemi.
> **Teknoloji:** Tauri v2 (Rust backend) + React (TypeScript + Tailwind CSS frontend)
> **Ana proje dosyası:** Kök dizindeki `CLAUDE.md` — kapsam ve iş takibi orada.
> Bu dosya ise **teknik uygulama rehberi**: kurulum adımları ve köprü kodları.

---

## 0. Büyük Resim: Bu Mimari Nasıl Çalışıyor?

Tauri uygulaması iki dünyadan oluşur ve bu ikisi bir **köprü** ile konuşur:

```
┌─────────────────────────────────────────────────────┐
│  MASAÜSTÜ PENCERESİ (Tauri)                          │
│                                                      │
│  ┌────────────────────┐      ┌────────────────────┐  │
│  │  FRONTEND (React)  │      │  BACKEND (Rust)    │  │
│  │                    │      │                    │  │
│  │  - Arayüz (UI)     │◄────►│  - Dosya okuma     │  │
│  │  - Sekmeler        │ IPC  │  - Dosya yazma     │  │
│  │  - Editör          │Köprü │  - Klasör listeleme│  │
│  │  - Dosya gezgini   │      │  - Silme/oluşturma │  │
│  └────────────────────┘      └────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

- **IPC (Inter-Process Communication / Süreçler Arası İletişim):** React tarafı diske
  doğrudan dokunamaz (güvenlik nedeniyle). Bunun yerine Rust tarafında tanımlı
  **Command** (komut) fonksiyonlarını `invoke()` ile çağırır.
- **Neden böyle?** Web teknolojileri (JavaScript) diske erişemez; bu bilinçli bir
  güvenlik duvarıdır. Rust tarafı "kapı görevlisi" gibidir: sadece bizim izin
  verdiğimiz işlemler yapılabilir.

**Neden Tauri (Electron değil)?**

| Kriter | Tauri | Electron |
|---|---|---|
| Uygulama boyutu | ~10 MB | ~150 MB+ |
| RAM kullanımı | Düşük | Yüksek |
| Backend dili | Rust (hızlı, güvenli) | Node.js |
| Sistem WebView kullanır | ✅ | ❌ (Chromium gömer) |

---

## 1. Kurulum Adımları

### 1.1 Ön Gereksinimler

**macOS:**
```bash
# Xcode komut satırı araçları (C derleyicisi için gerekli)
xcode-select --install

# Rust kurulumu (rustup = Rust'ın sürüm yöneticisi)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
1. [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) kur ("Desktop development with C++" seçeneği ile)
2. [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Windows 10/11'de genelde hazır gelir)
3. [rustup-init.exe](https://rustup.rs) ile Rust'ı kur

**Her iki platformda:** Node.js 20+ gerekli.

### 1.2 Projeyi Oluşturma

```bash
cd ~/Desktop/Projects/NoteAppTG

# Tauri proje şablonunu oluştur (React + TypeScript seçili)
npm create tauri-app@latest . -- --template react-ts

# Bağımlılıkları indir
npm install
```

> ⚠️ Sihirbaz soru sorarsa: paket yöneticisi = **npm**, UI şablonu = **React**,
> dil = **TypeScript** seç.

### 1.3 Ek Paketlerin Kurulumu

```bash
# --- Frontend paketleri ---

# Tailwind CSS v4 (stil kütüphanesi) + Vite eklentisi
npm install tailwindcss @tailwindcss/vite

# TipTap (Evernote tarzı zengin metin editörü motoru)
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm

# Zustand (küçük ve basit global state/durum yönetimi kütüphanesi)
npm install zustand

# İkonlar
npm install lucide-react

# --- Tauri eklentileri ---

# Dialog eklentisi: yerel "klasör seç" penceresini açmak için
# (Bu komut hem Rust hem JS tarafını otomatik ayarlar)
npm run tauri add dialog
```

### 1.4 Tailwind'i Vite'a Bağlama

`vite.config.ts` dosyasına eklenti ekle:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // Tailwind v4 eklentisi

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ... Tauri'nin şablonla gelen diğer ayarlarına DOKUNMA
});
```

`src/App.css` (veya `src/index.css`) dosyasının en üstüne:

```css
@import "tailwindcss";
```

### 1.5 Çalıştırma

```bash
npm run tauri dev   # Geliştirme modu: pencere açılır, kod değişince otomatik yenilenir
npm run tauri build # Dağıtım için kurulum dosyası üretir (.dmg / .msi)
```

---

## 2. Proje Klasör Yapısı

```
NoteAppTG/
├── CLAUDE.md                     # 🎯 ANA PROJE DOSYASI: kapsam + iş takibi
├── .claude/
│   └── YOL-HARITASI.md           # Bu dosya: teknik rehber
│
├── src/                          # ⚛️ FRONTEND (React + TypeScript)
│   ├── main.tsx                  # React'ın giriş noktası
│   ├── App.tsx                   # Ana yerleşim (layout): gezgin + sekmeler + editör
│   ├── App.css                   # Tailwind import'u ve global stiller
│   │
│   ├── types/
│   │   └── index.ts              # Ortak TypeScript tipleri (DosyaDugumu, Sekme...)
│   │
│   ├── lib/
│   │   └── tauriKoprusu.ts       # 🌉 KÖPRÜ: Rust komutlarını çağıran fonksiyonlar
│   │
│   ├── store/
│   │   └── uygulamaDeposu.ts     # Zustand: global durum (sekmeler, aktif dosya...)
│   │
│   ├── components/
│   │   ├── FileExplorer/
│   │   │   ├── FileExplorer.tsx  # Sol panel: çalışma alanı ağacı
│   │   │   └── AgacDugumu.tsx    # Tek bir dosya/klasör satırı (özyinelemeli)
│   │   ├── TabBar/
│   │   │   └── TabBar.tsx        # Üst sekme çubuğu (Notepad++ tarzı)
│   │   └── Editor/
│   │       └── Editor.tsx        # TipTap zengin metin editörü
│   │
│   └── hooks/
│       └── useKlavyeKisayollari.ts  # Cmd/Ctrl+S gibi kısayollar
│
├── src-tauri/                    # 🦀 BACKEND (Rust)
│   ├── Cargo.toml                # Rust bağımlılık listesi (package.json'ın Rust'ı)
│   ├── tauri.conf.json           # Pencere boyutu, uygulama adı gibi ayarlar
│   ├── capabilities/
│   │   └── default.json          # İzin sistemi: frontend hangi API'lere erişebilir
│   └── src/
│       ├── main.rs               # Uygulama giriş noktası (dokunmaya gerek yok)
│       ├── lib.rs                # Komutların kayıt edildiği merkez
│       ├── state.rs              # Uygulama durumu (seçili çalışma alanı yolu)
│       └── commands/
│           ├── mod.rs            # Modül tanımı
│           └── dosya_islemleri.rs # 🌉 KÖPRÜ: Tüm dosya sistemi komutları
│
└── package.json
```

**Neden bu düzen?**
- Frontend ve backend **aynı repoda** ama net ayrılmış: `src/` = React, `src-tauri/` = Rust.
- Köprü kodu iki tarafta da **tek dosyada** toplanıyor (`tauriKoprusu.ts` ↔ `dosya_islemleri.rs`).
  Yeni bir komut eklerken sadece bu iki dosyaya + `lib.rs`'e dokunursun.

---

## 3. Backend Mimarisi (Tauri / Rust)

### 3.1 `src-tauri/Cargo.toml` — Ek Bağımlılıklar

```toml
[dependencies]
# ... şablonla gelenler kalsın (tauri, serde, serde_json) ...

# "trash": dosyaları kalıcı silmek yerine Geri Dönüşüm Kutusu'na taşır.
# Neden? Kullanıcı yanlışlıkla sildiğinde geri alabilsin — güvenli silme.
trash = "5"
```

### 3.2 `src-tauri/src/state.rs` — Uygulama Durumu

```rust
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
```

### 3.3 `src-tauri/src/commands/dosya_islemleri.rs` — Köprü Komutları

```rust
// ============================================================
// DOSYA SİSTEMİ KOMUTLARI
// Frontend'in invoke() ile çağırabildiği tüm fonksiyonlar burada.
// #[tauri::command] etiketi, fonksiyonu IPC köprüsüne açar.
// ============================================================

use std::fs;
use std::path::{Path, PathBuf};
use serde::Serialize;
use tauri::State;
use crate::state::UygulamaDurumu;

// ------------------------------------------------------------
// VERİ YAPISI: Dosya ağacındaki tek bir düğüm (dosya veya klasör)
// ------------------------------------------------------------
// #[derive(Serialize)]: Bu yapı otomatik olarak JSON'a çevrilebilir olsun.
// rename_all = "camelCase": Rust'ta snake_case (klasor_mu) kullanılır,
// JavaScript'te camelCase (klasorMu). Bu satır çeviriyi otomatik yapar.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DosyaDugumu {
    pub isim: String,        // Örn: "notlarim.md"
    pub yol: String,         // Tam yol: "/Users/m2/Notlar/notlarim.md"
    pub klasor_mu: bool,     // true = klasör, false = dosya
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
        hedef.canonicalize().map_err(|e| format!("Yol çözümlenemedi: {}", e))?
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
pub fn calisma_alani_ayarla(
    yol: String,
    durum: State<UygulamaDurumu>,
) -> Result<(), String> {
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
    let girdiler = fs::read_dir(&guvenli_yol)
        .map_err(|e| format!("Klasör okunamadı: {}", e))?;

    for girdi in girdiler {
        let girdi = girdi.map_err(|e| e.to_string())?;
        let dosya_yolu = girdi.path();
        let isim = girdi.file_name().to_string_lossy().to_string();

        // Gizli dosyaları atla (.git, .DS_Store gibi nokta ile başlayanlar)
        if isim.starts_with('.') {
            continue;
        }

        dugumler.push(DosyaDugumu {
            isim,
            yol: dosya_yolu.to_string_lossy().to_string(),
            klasor_mu: dosya_yolu.is_dir(),
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

    fs::read_to_string(&guvenli_yol)
        .map_err(|e| format!("Dosya okunamadı: {}", e))
}

// ------------------------------------------------------------
// KOMUT 4: Dosyaya yaz (kaydet)
// ------------------------------------------------------------
#[tauri::command]
pub fn dosya_yaz(
    yol: String,
    icerik: String,
    durum: State<UygulamaDurumu>,
) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    fs::write(&guvenli_yol, icerik)
        .map_err(|e| format!("Dosya kaydedilemedi: {}", e))
}

// ------------------------------------------------------------
// KOMUT 5: Yeni dosya oluştur
// ------------------------------------------------------------
#[tauri::command]
pub fn yeni_dosya_olustur(
    yol: String,
    durum: State<UygulamaDurumu>,
) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    // Aynı isimde dosya varsa üzerine yazmayı ENGELLE
    if guvenli_yol.exists() {
        return Err("Bu isimde bir dosya zaten var.".into());
    }

    fs::write(&guvenli_yol, "")
        .map_err(|e| format!("Dosya oluşturulamadı: {}", e))
}

// ------------------------------------------------------------
// KOMUT 6: Yeni klasör oluştur
// ------------------------------------------------------------
#[tauri::command]
pub fn yeni_klasor_olustur(
    yol: String,
    durum: State<UygulamaDurumu>,
) -> Result<(), String> {
    let guvenli_yol = yol_guvenli_mi(&durum, &yol)?;

    if guvenli_yol.exists() {
        return Err("Bu isimde bir klasör zaten var.".into());
    }

    fs::create_dir(&guvenli_yol)
        .map_err(|e| format!("Klasör oluşturulamadı: {}", e))
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

    trash::delete(&guvenli_yol)
        .map_err(|e| format!("Silinemedi: {}", e))
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

    fs::rename(&guvenli_eski, &guvenli_yeni)
        .map_err(|e| format!("Yeniden adlandırılamadı: {}", e))
}
```

### 3.4 `src-tauri/src/commands/mod.rs`

```rust
// Bu dosya "commands" klasörünü bir Rust modülü yapar.
// Yeni komut dosyası eklersen buraya bir satır eklemen yeterli.
pub mod dosya_islemleri;
```

### 3.5 `src-tauri/src/lib.rs` — Komutları Kaydetme

```rust
// Uygulamanın kurulum merkezi.
// Yazdığımız her komut, invoke_handler listesine EKLENMEK ZORUNDA —
// eklemeyi unutursan frontend "command not found" hatası alır.

mod commands;
mod state;

use commands::dosya_islemleri;
use state::UygulamaDurumu;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Dialog eklentisi: klasör seçme penceresi için
        .plugin(tauri_plugin_dialog::init())
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
        ])
        .run(tauri::generate_context!())
        .expect("Tauri uygulaması başlatılamadı");
}
```

> **Not — İzinler (Capabilities):** Tauri v2'de eklentiler izin ister.
> `npm run tauri add dialog` komutu `src-tauri/capabilities/default.json`
> dosyasına `"dialog:default"` iznini otomatik ekler. Eklemediyse elle ekle:
> ```json
> { "permissions": ["core:default", "dialog:default"] }
> ```

---

## 4. Frontend Mimarisi (React)

### 4.1 `src/types/index.ts` — Ortak Tipler

```typescript
// Rust tarafındaki DosyaDugumu struct'ının TypeScript karşılığı.
// İki taraftaki alan adları birebir eşleşmeli (camelCase çevirisiyle).
export interface DosyaDugumu {
  isim: string;      // Dosya/klasör adı
  yol: string;       // Diskteki tam yol — aynı zamanda benzersiz kimlik (ID) olarak kullanılır
  klasorMu: boolean; // true = klasör
}

// Açık bir sekmeyi temsil eder (Notepad++ mantığı)
export interface Sekme {
  yol: string;                        // Dosyanın tam yolu (benzersiz kimlik)
  baslik: string;                     // Sekmede görünen isim
  icerik: string;                     // Editördeki güncel içerik
  kaydedilmemisDegisiklikVar: boolean; // true ise sekmede "●" işareti göster
}
```

### 4.2 `src/lib/tauriKoprusu.ts` — 🌉 Köprü Fonksiyonları

Bu dosya projenin **en kritik** dosyalarından biri: Rust komutlarını tip güvenli
(type-safe) TypeScript fonksiyonlarına sarar. Bileşenler asla doğrudan `invoke`
çağırmaz — hep bu dosyayı kullanır. Böylece bir komutun imzası değişirse
tek yerden düzeltirsin.

```typescript
// ============================================================
// TAURI KÖPRÜSÜ
// Rust backend'deki komutları çağıran fonksiyonlar.
// invoke("komut_adi", { parametreler }) → Rust fonksiyonunu çalıştırır
// ============================================================

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { DosyaDugumu } from "../types";

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
  return invoke("yeniden_adlandir", { eskiYol, yeniYol });
}
```

> **Dikkat — isimlendirme çevirisi:** Rust'ta parametre `eski_yol` (snake_case)
> yazılır ama `invoke` çağrısında `eskiYol` (camelCase) gönderilir.
> Tauri bu çeviriyi otomatik yapar. Bu, en sık yapılan hata kaynağıdır!

### 4.3 `src/store/uygulamaDeposu.ts` — Global Durum (Zustand)

**Zustand nedir?** React'ta bileşenler arası veri paylaşımı için küçük bir
kütüphane. Redux'ın çok daha basit hali. "Store" (depo) tanımlarsın, herhangi
bir bileşen okuyup güncelleyebilir.

```typescript
import { create } from "zustand";
import type { Sekme } from "../types";
import { dosyaOku, dosyaYaz } from "../lib/tauriKoprusu";

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
  icerikGuncelle: (yol: string, yeniIcerik: string) => void;
  aktifSekmeyiKaydet: () => Promise<void>;
}

export const useUygulamaDeposu = create<UygulamaDeposu>((set, get) => ({
  calismaAlaniYolu: null,
  sekmeler: [],
  aktifSekmeYolu: null,

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

  // Editörde her değişiklikte çağrılır: içeriği güncelle + "kirli" işaretle
  icerikGuncelle: (yol, yeniIcerik) =>
    set((durum) => ({
      sekmeler: durum.sekmeler.map((sekme) =>
        sekme.yol === yol
          ? { ...sekme, icerik: yeniIcerik, kaydedilmemisDegisiklikVar: true }
          : sekme
      ),
    })),

  // Cmd/Ctrl+S: aktif sekmeyi diske yaz, "kirli" işaretini kaldır
  aktifSekmeyiKaydet: async () => {
    const { sekmeler, aktifSekmeYolu } = get();
    const aktifSekme = sekmeler.find((sekme) => sekme.yol === aktifSekmeYolu);
    if (!aktifSekme) return;

    await dosyaYaz(aktifSekme.yol, aktifSekme.icerik); // Rust'a gönder

    set((durum) => ({
      sekmeler: durum.sekmeler.map((sekme) =>
        sekme.yol === aktifSekmeYolu
          ? { ...sekme, kaydedilmemisDegisiklikVar: false }
          : sekme
      ),
    }));
  },
}));
```

### 4.4 `src/components/FileExplorer/AgacDugumu.tsx` — Özyinelemeli Ağaç

**Özyineleme (recursion) nedir?** Bir bileşenin kendi içinde kendini çağırması.
Klasörler iç içe olduğu için ağaç yapısını çizmenin en doğal yolu budur.

```tsx
import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import type { DosyaDugumu } from "../../types";
import { klasorIceriginiListele } from "../../lib/tauriKoprusu";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";

interface Props {
  dugum: DosyaDugumu;
  derinlik: number; // İç içe seviyesi — girinti (indent) hesabı için
}

export function AgacDugumu({ dugum, derinlik }: Props) {
  const [acik, setAcik] = useState(false);              // Klasör açık mı?
  const [cocuklar, setCocuklar] = useState<DosyaDugumu[] | null>(null);
  const dosyaAc = useUygulamaDeposu((d) => d.dosyaAc);

  const tiklandi = async () => {
    if (dugum.klasorMu) {
      // Klasör: aç/kapat. İçeriği daha önce yüklenmediyse ŞİMDİ yükle
      // (lazy loading — tembel yükleme)
      if (!acik && cocuklar === null) {
        const icerik = await klasorIceriginiListele(dugum.yol);
        setCocuklar(icerik);
      }
      setAcik(!acik);
    } else {
      // Dosya: sekmede aç
      await dosyaAc(dugum.yol, dugum.isim);
    }
  };

  return (
    <div>
      {/* Satırın kendisi — derinliğe göre soldan girinti */}
      <button
        onClick={tiklandi}
        className="flex w-full items-center gap-1 px-2 py-0.5 text-sm hover:bg-zinc-700/50 rounded"
        style={{ paddingLeft: `${derinlik * 14 + 8}px` }}
      >
        {dugum.klasorMu ? (
          <>
            {acik ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-amber-400" />
          </>
        ) : (
          <FileText size={14} className="ml-[14px] text-zinc-400" />
        )}
        <span className="truncate">{dugum.isim}</span>
      </button>

      {/* Klasör açıksa çocuklarını çiz — İŞTE ÖZYİNELEME BURADA:
          AgacDugumu kendi içinde yine AgacDugumu çağırıyor */}
      {acik &&
        cocuklar?.map((cocuk) => (
          <AgacDugumu key={cocuk.yol} dugum={cocuk} derinlik={derinlik + 1} />
        ))}
    </div>
  );
}
```

### 4.5 `src/components/FileExplorer/FileExplorer.tsx` — Sol Panel

```tsx
import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import type { DosyaDugumu } from "../../types";
import { calismaAlaniSec, klasorIceriginiListele } from "../../lib/tauriKoprusu";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";
import { AgacDugumu } from "./AgacDugumu";

export function FileExplorer() {
  const calismaAlaniYolu = useUygulamaDeposu((d) => d.calismaAlaniYolu);
  const calismaAlaniAyarla = useUygulamaDeposu((d) => d.calismaAlaniAyarla);
  const [kokDugumler, setKokDugumler] = useState<DosyaDugumu[]>([]);

  // Çalışma alanı değiştiğinde kök klasörün içeriğini yükle
  useEffect(() => {
    if (!calismaAlaniYolu) return;
    klasorIceriginiListele(calismaAlaniYolu).then(setKokDugumler);
  }, [calismaAlaniYolu]);

  const klasorSecTiklandi = async () => {
    const yol = await calismaAlaniSec(); // Yerel klasör seçme penceresi
    if (yol) calismaAlaniAyarla(yol);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-700 bg-zinc-800 text-zinc-200">
      {/* Panel başlığı */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide">Dosyalar</span>
        <button
          onClick={klasorSecTiklandi}
          title="Çalışma alanı seç"
          className="rounded p-1 hover:bg-zinc-700"
        >
          <FolderOpen size={16} />
        </button>
      </div>

      {/* Ağaç veya boş durum mesajı */}
      <div className="flex-1 overflow-y-auto py-1">
        {calismaAlaniYolu ? (
          kokDugumler.map((dugum) => (
            <AgacDugumu key={dugum.yol} dugum={dugum} derinlik={0} />
          ))
        ) : (
          <p className="px-3 py-4 text-xs text-zinc-500">
            Henüz çalışma alanı seçilmedi. Yukarıdaki klasör ikonuna tıklayın.
          </p>
        )}
      </div>
    </aside>
  );
}
```

### 4.6 `src/components/TabBar/TabBar.tsx` — Sekme Çubuğu

```tsx
import { X } from "lucide-react";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";

export function TabBar() {
  const sekmeler = useUygulamaDeposu((d) => d.sekmeler);
  const aktifSekmeYolu = useUygulamaDeposu((d) => d.aktifSekmeYolu);
  const aktifSekmeyiDegistir = useUygulamaDeposu((d) => d.aktifSekmeyiDegistir);
  const sekmeKapat = useUygulamaDeposu((d) => d.sekmeKapat);

  return (
    <div className="flex h-9 items-end overflow-x-auto border-b border-zinc-700 bg-zinc-800">
      {sekmeler.map((sekme) => {
        const aktifMi = sekme.yol === aktifSekmeYolu;
        return (
          <div
            key={sekme.yol}
            onClick={() => aktifSekmeyiDegistir(sekme.yol)}
            className={`group flex cursor-pointer items-center gap-2 border-r border-zinc-700 px-3 py-1.5 text-sm
              ${aktifMi
                ? "bg-zinc-900 text-white"          // Aktif sekme: koyu, öne çıkık
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
          >
            {/* Kaydedilmemiş değişiklik varsa "●" göster (Notepad++ mantığı) */}
            <span>
              {sekme.kaydedilmemisDegisiklikVar && (
                <span className="mr-1 text-amber-400">●</span>
              )}
              {sekme.baslik}
            </span>

            {/* Kapatma düğmesi */}
            <button
              onClick={(olay) => {
                olay.stopPropagation(); // Sekmeye tıklama olayını tetikleme!
                if (
                  sekme.kaydedilmemisDegisiklikVar &&
                  !confirm(`"${sekme.baslik}" dosyasında kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?`)
                ) {
                  return;
                }
                sekmeKapat(sekme.yol);
              }}
              className="rounded p-0.5 opacity-0 hover:bg-zinc-600 group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

### 4.7 `src/components/Editor/Editor.tsx` — TipTap Zengin Metin Editörü

**TipTap nedir?** ProseMirror motoru üzerine kurulu, React ile çok iyi çalışan
bir zengin metin editörü kütüphanesi. Evernote/Notion tarzı editörlerin çoğu bu
motoru kullanır. `StarterKit` paketi kalın/italik/başlık/liste gibi temel
özellikleri hazır getirir.

```tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";

export function Editor() {
  const sekmeler = useUygulamaDeposu((d) => d.sekmeler);
  const aktifSekmeYolu = useUygulamaDeposu((d) => d.aktifSekmeYolu);
  const icerikGuncelle = useUygulamaDeposu((d) => d.icerikGuncelle);

  const aktifSekme = sekmeler.find((sekme) => sekme.yol === aktifSekmeYolu);

  const editor = useEditor({
    extensions: [StarterKit], // Kalın, italik, başlıklar, listeler, kod bloğu...
    content: aktifSekme?.icerik ?? "",
    // Kullanıcı her yazdığında store'daki içeriği güncelle
    onUpdate: ({ editor }) => {
      if (aktifSekmeYolu) {
        icerikGuncelle(aktifSekmeYolu, editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        // "prose" sınıfı Tailwind Typography ile güzel varsayılan stiller verir
        class: "prose prose-invert max-w-none h-full p-6 focus:outline-none",
      },
    },
  });

  // Sekme değişince editörün içeriğini yeni sekmenin içeriğiyle değiştir
  useEffect(() => {
    if (editor && aktifSekme) {
      // İçerik zaten aynıysa dokunma (imleç konumu sıçramasın diye)
      if (editor.getHTML() !== aktifSekme.icerik) {
        editor.commands.setContent(aktifSekme.icerik);
      }
    }
  }, [aktifSekmeYolu, editor]); // Sadece sekme DEĞİŞİNCE çalışır

  if (!aktifSekme) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Soldaki gezginden bir dosya açın 📄
      </div>
    );
  }

  return <EditorContent editor={editor} className="h-full overflow-y-auto" />;
}
```

> **Önemli karar — içerik formatı:** TipTap içeriği HTML olarak üretir
> (`getHTML()`). İlk aşamada notları `.html` uzantılı kaydetmek en kolayıdır.
> İleride `.md` (Markdown) istersen `tiptap-markdown` eklentisiyle
> HTML ↔ Markdown çevirisi yapabilirsin — Faz 3'e bak.

### 4.8 `src/hooks/useKlavyeKisayollari.ts` — Cmd/Ctrl+S

```typescript
import { useEffect } from "react";
import { useUygulamaDeposu } from "../store/uygulamaDeposu";

// Klavye kısayollarını dinleyen özel hook (kanca).
// Hook nedir? React'ta tekrar kullanılabilir mantık parçası; "use" ile başlar.
export function useKlavyeKisayollari() {
  const aktifSekmeyiKaydet = useUygulamaDeposu((d) => d.aktifSekmeyiKaydet);

  useEffect(() => {
    const tusaBasildi = (olay: KeyboardEvent) => {
      // metaKey = macOS'ta Cmd, ctrlKey = Windows'ta Ctrl
      const kaydetKisayolu = (olay.metaKey || olay.ctrlKey) && olay.key === "s";

      if (kaydetKisayolu) {
        olay.preventDefault(); // Tarayıcının kendi "sayfayı kaydet" penceresini engelle
        aktifSekmeyiKaydet();
      }
    };

    window.addEventListener("keydown", tusaBasildi);
    // Temizlik: bileşen kaldırılırsa dinleyiciyi de kaldır (bellek sızıntısı olmasın)
    return () => window.removeEventListener("keydown", tusaBasildi);
  }, [aktifSekmeyiKaydet]);
}
```

### 4.9 `src/App.tsx` — Her Şeyi Birleştiren Yerleşim

```tsx
import { FileExplorer } from "./components/FileExplorer/FileExplorer";
import { TabBar } from "./components/TabBar/TabBar";
import { Editor } from "./components/Editor/Editor";
import { useKlavyeKisayollari } from "./hooks/useKlavyeKisayollari";
import "./App.css";

export default function App() {
  useKlavyeKisayollari(); // Cmd/Ctrl+S dinleyicisini başlat

  return (
    // Yerleşim: solda gezgin (sabit genişlik), sağda sekmeler + editör (esnek)
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-900 text-zinc-100">
      <FileExplorer />
      <main className="flex flex-1 flex-col">
        <TabBar />
        <div className="flex-1 overflow-hidden">
          <Editor />
        </div>
      </main>
    </div>
  );
}
```

---

## 5. Sık Yapılan Hatalar (Şimdiden Bil!)

1. **"Command not found" hatası** → Yeni Rust komutunu `lib.rs` içindeki
   `generate_handler!` listesine eklemeyi unuttun.
2. **Parametre `undefined` geliyor** → Rust'ta `snake_case`, JS `invoke`
   çağrısında `camelCase` olmalı (`eski_yol` ↔ `eskiYol`).
3. **Rust değişikliği görünmüyor** → Rust kodu değişince `tauri dev` otomatik
   yeniden derler ama bazen yavaştır; terminaldeki derleme çıktısını bekle.
4. **Dialog açılmıyor** → `capabilities/default.json` içinde `dialog:default`
   izni eksik.
5. **Editör içeriği sekmeler arası karışıyor** → `useEffect` bağımlılık
   dizisine `aktifSekmeYolu` koymayı unutma (bkz. Editor.tsx).

# 📝 VerdantNote — Ana Proje Dosyası

> Bu dosya projenin **anayasasıdır**: kapsam, teknoloji kararları ve iş takibi
> burada tutulur. Her çalışma oturumunda önce bu dosyaya bakılır, biten işler
> işaretlenir, yeni kararlar buraya işlenir.
>
> Detaylı teknik rehber (kurulum adımları + tüm köprü kodları):
> [.claude/YOL-HARITASI.md](.claude/YOL-HARITASI.md)

---

## 1. Proje Kapsamı

**VerdantNote**, macOS ve Windows üzerinde çalışan, cross-platform (çapraz
platform) bir masaüstü not tutma uygulamasıdır.

**Konsept:** İki uygulamanın en iyi yanlarının birleşimi:

- **Evernote** → zengin metin editörü (kalın, italik, başlıklar, listeler...)
- **Notepad++** → kompakt dosya gezgini (File Explorer) + çoklu sekme (Tab) sistemi

**Temel çalışma modeli:**

1. Kullanıcı diskinden bir klasörü **"Çalışma Alanı" (Workspace)** olarak seçer.
2. Sol panelde bu klasörün ağacı (iç içe klasörler dahil) listelenir.
3. Dosyaya tıklayınca üstte **sekme** olarak açılır; kaydedilmemiş
 değişiklikler sekmede `●` işaretiyle takip edilir.
4. Merkezdeki **zengin metin editöründe** (TipTap) not yazılır,
 Cmd/Ctrl+S ile diske kaydedilir.

**Kapsam DIŞI (şimdilik):** Bulut senkronizasyonu, çoklu kullanıcı,
mobil sürüm, eklenti sistemi.

---

## 2. Teknoloji Kararları

### Önemli Mimari Kararlar

- **IPC Köprüsü tek noktadan:** Frontend'de `src/lib/tauriKoprusu.ts`,
backend'de `src-tauri/src/commands/dosya_islemleri.rs`. Bileşenler asla
doğrudan `invoke()` çağırmaz.
- **Lazy loading (tembel yükleme):** Dosya ağacı tek seviye okunur; klasöre
tıklanınca içeriği yüklenir. Büyük klasörlerde donmayı önler.
- **Güvenlik:** Her dosya işlemi Rust tarafında `yol_guvenli_mi` kontrolünden
geçer — çalışma alanı dışına erişim (path traversal) engellenir.
- **Silme = çöpe taşıma:** Geri alınamaz kalıcı silme yok.
- **İçerik formatı:** `.md` dosyaları Markdown, diğer her şey HTML olarak
kaydedilir. Markdown için resmî `@tiptap/markdown` paketi kullanılıyor
(plan `tiptap-markdown` idi ama TipTap v3 ile resmî paket çıktı — o tercih edildi).
- **`dragDropEnabled: false` (tauri.conf.json):** Tauri'nin yerel dosya bırakma
yakalayıcısı, uygulama İÇİ HTML5 sürükle-bırak olaylarını yutuyordu.
Kapatınca gezgindeki sürükle-taşı çalışır; masaüstünden pencereye dosya
bırakma özelliği kaybolur (kullanmıyoruz).
- **Görseller nota gömülür:** Panodan yapıştırılan görsel base64 `data:`
adresi olarak içeriğin içine yazılır — ayrı dosya yönetimi gerekmez.
- **macOS'ta silme `NsFileManager` ile:** `trash` kütüphanesinin varsayılanı
(Finder + AppleScript) iCloud eşitlemeli klasörlerde -8013 hatası veriyor.
NSFileManager sorunsuz; tek kayıp Çöp Sepeti'ndeki "Geri Koy" düğmesi.
- **Arama Rust'ta ve sınırlı:** En fazla 200 sonuç, 1 MB üstü dosyalar
atlanır — arayüz donmasın, bellek şişmesin diye.
- **Tema `<html class="koyu">` ile:** Tailwind'in `dark:` varyantı işletim
sistemi yerine bu sınıfa bağlandı (`@custom-variant`, App.css) —
tema uygulama içinden yönetilir, tercih `ayarlar.json`a kaydedilir.
- **İki editör, tek kural:** `.html`/`.md` → TipTap (not modu, `</>` ile
kaynak görünümüne geçilebilir); diğer tüm metin dosyaları → CodeMirror 6
(`@uiw/react-codemirror` + VS Code teması). Dil paketleri
`@codemirror/language-data` ile dosya adına göre dinamik yüklenir.
- **Metin algılama Rust'ta:** Uzantı beyaz/kara listeleri + bilinmeyen
uzantıda ilk 1024 baytta NUL kontrolü (git'in kullandığı yöntem).
`DosyaDugumu.metin_mi` alanıyla frontend'e taşınır.
- **Kategoriler `kategoriler.json`da:** kategori listesi + yol→kategori
atamaları. Taşıma/yeniden adlandırma/silme işlemleri atamaları da günceller.
- **Kendi modal bileşenlerimiz:** Tarayıcının `prompt()/confirm()` fonksiyonları
Tauri WebView'ında her platformda güvenilir çalışmaz — isim girme ve onay
için kendi bileşenlerimiz var (`components/Modallar/`).
- **İki ayrı Zustand deposu:** `uygulamaDeposu` veri tutar (sekmeler, içerik);
`gezginDeposu` geçici arayüz durumu tutar (sağ tık menüsü, modal,
ağaç yenileme sayacı, hata mesajı). Ayrım kodu düzenli tutar.
- **Taşıma/silme sekmeleri günceller:** Dosya taşınınca/adı değişince açık
sekmelerin yolları düzeltilir; silinince ilgili sekmeler kapatılır.
- **Kod dili:** Değişken/fonksiyon isimleri ve yorumlar **Türkçe** —
kullanıcı kodu okurken anlayabilsin (öğrenme amaçlı proje).

---

## 3. Proje Yapısı (Özet)

```
VerdantNote/
├── CLAUDE.md                  # Bu dosya: kapsam + iş takibi
├── .claude/YOL-HARITASI.md    # Teknik rehber: kurulum + köprü kodları
├── src/                       # ⚛️ React frontend
│   ├── lib/tauriKoprusu.ts    # 🌉 Rust komutlarını çağıran köprü
│   ├── store/uygulamaDeposu.ts# Zustand global durum
│   ├── components/            # FileExplorer / TabBar / Editor
│   └── hooks/                 # Klavye kısayolları vb.
└── src-tauri/                 # 🦀 Rust backend
    └── src/
        ├── lib.rs             # Komut kayıt merkezi
        ├── state.rs           # Çalışma alanı durumu
        └── commands/dosya_islemleri.rs  # 🌉 Dosya sistemi komutları
```

---

## 4. İş Takibi

### 🔵 Faz 1 — Temel İskelet (AKTİF)

- Tauri + React + TypeScript proje kurulumu (\`npm create tauri-app\`)
- Tailwind CSS v4 entegrasyonu (+ \`@tailwindcss/typography\` — editörün \`prose\` stilleri için)
- Ek paketler: TipTap, Zustand, lucide-react, dialog eklentisi
- Rust: \`state.rs\` (çalışma alanı durumu)
- Rust: \`dosya\_islemleri.rs\` (8 komut: workspace, listele, oku, yaz, oluştur ×2, sil, yeniden adlandır)
- Rust: \`lib.rs\` komut kayıtları + \`trash\` bağımlılığı
- Frontend: tipler (\`types/index.ts\`) + köprü (\`tauriKoprusu.ts\`)
- Frontend: Zustand deposu (\`uygulamaDeposu.ts\`)
- Bileşen: FileExplorer + AgacDugumu (özyinelemeli ağaç, lazy loading)
- Bileşen: TabBar (sekme + ● kaydedilmemiş işareti)
- Bileşen: Editor (TipTap)
- Cmd/Ctrl+S kaydetme kısayolu
- Uçtan uca test: klasör seç → dosya aç → düzenle → kaydet
(kod derlendi: tsc ✅, cargo check ✅, vite build ✅ — pencerede elle test edilecek)

### ✅ Faz 2 — Dosya Yönetimi (TAMAMLANDI)

- Sağ tık menüsü (context menu): yeni dosya, yeni klasör, sil, yeniden adlandır
- Silme öncesi onay penceresi (kendi \`OnayModali\` bileşenimiz)
- Gezginde sürükle-bırak ile taşıma (açık sekmelerin yolları da güncellenir)
— ilk testte çalışmadı, \`dragDropEnabled: false\` ile düzeltildi, yeniden test edilecek
- Son çalışma alanını hatırlama (\`tauri-plugin-store\` ile kalıcı ayar)
- Elle test edildi (sürükle-bırak dışında her şey onaylandı)

### ✅ Faz 3 — Editör Zenginleştirme (TAMAMLANDI — elle test edildi)

- Araç çubuğu (kalın, italik, başlık, liste, alıntı, kod, geri al/yinele)
- \`@tiptap/markdown\` ile \`.md\` dosya desteği (uzantıya göre format seçilir)
- Panodan görsel yapıştırma (base64 olarak nota gömülür)
- Otomatik kaydetme (debounce — yazmayı bıraktıktan 2 sn sonra, sekme başına)
- Düzeltme: sürükle-bırak çalışmıyordu → \`dragDropEnabled: false\`
- Düzeltme: iCloud klasöründe silme hatası (-8013) → macOS'ta \`NsFileManager\` yöntemi

### 🔵 Faz 4 — Cila (KOD TAMAM — elle test bekliyor)

- Tüm çalışma alanında arama: dosya adı + içerik, Rust tarafında (\`arama.rs\`)
- Açık/koyu tema geçişi (gezgin başlığındaki güneş/ay düğmesi, tercih kalıcı)
- Sekmeleri sürükleyerek sıralama
- Pencere kapanırken kaydedilmemiş sekme uyarısı (yerel \`ask\` penceresi)
- Elle test: arama, tema geçişi + kalıcılığı, sekme sıralama, kirli sekmeyle pencere kapatma

### 🔵 Faz 5 — Kod Görüntüleme ve Organizasyon (KOD TAMAM — elle test bekliyor)

- Geniş metin uzantı desteği (web/programlama/betik/yapılandırma listesi)
- Bilinmeyen uzantıda içerik koklama: \`.data\`, \`.log2\` gibi dosyalar
içeriği metinse açılabilir; ikili dosyalar soluk görünür, açılamaz
- Kod görüntüleyici: CodeMirror 6 + VS Code teması (renklendirme,
satır numarası, kod katlama — XML etiketleri açılıp kapanabilir)
- Not dosyalarında (.html/.md) zengin metin ↔ kaynak kod geçiş düğmesi
- Kategori sistemi: renk + etiketle sınırsız kategori, dosyaya sağ tıkla
atama, ağaçta renkli nokta, \`kategoriler.json\`da kalıcı
- Elle test: .xml/.py/.json aç (renklendirme + katlama), .data içinde metin
olan dosya aç, kategori oluştur/ata/sil, taşınan dosyanın kategorisi korunmalı

### 🔵 Faz 6 — Dağıtım (macOS TAMAM — Windows GitHub'a yükleme bekliyor)

- Proje adı her yerde **VerdantNote** yapıldı (paket, pencere, kimlik: `com.tolunay.verdantnote`)
- macOS `.dmg` üretildi: `src-tauri/target/release/bundle/dmg/VerdantNote_0.1.0_aarch64.dmg`
  — Tauri'nin DMG betiği Finder izni istediği için `hdiutil` ile elle paketlendi
- GitHub Actions iş akışı hazır: `.github/workflows/kurulum-paketleri.yml`
  (macOS Apple Silicon + Intel `.dmg`, Windows `.msi` + `.exe` üretir)
- Bekleyen: proje GitHub'a yüklenecek → Actions çalıştırılacak → Windows paketi inecek
- Not: paketler imzasız — ilk açılışta macOS'ta sağ tık → "Aç",
  Windows'ta "Ek bilgi → Yine de çalıştır" gerekir

---

## 5. Çalışma Kuralları (Claude için)

- Her oturumda önce bu dosyadaki **İş Takibi** bölümüne bak; biten işleri `[x]` yap.
- Yeni bir mimari karar alındığında **Bölüm 2**'ye ekle.
- Kod yazarken: Türkçe yorumlar, anlamlı Türkçe değişken isimleri,
her fonksiyonun üstüne açıklama.
- Yeni Rust komutu eklerken 3 yeri güncelle: `dosya_islemleri.rs` (veya yeni
modül) → `lib.rs` içindeki `generate_handler!` → `tauriKoprusu.ts`.
- Kullanıcı öğrenme aşamasında: değişiklikleri adım adım, öğretici şekilde açıkla.

## 6. Komutlar

```bash
npm run tauri dev    # Geliştirme modu (canlı yenileme ile pencere açar)
npm run tauri build  # Dağıtım paketi üret (.dmg / .msi)
```

DMG betiği Finder izni yüzünden hata verirse (.app yine de üretilir), elle paketle:

```bash
cd src-tauri/target/release/bundle
mkdir dmg-hazirlik && cp -R macos/VerdantNote.app dmg-hazirlik/
ln -s /Applications dmg-hazirlik/Applications
hdiutil create -volname "VerdantNote" -srcfolder dmg-hazirlik -ov -format UDZO dmg/VerdantNote.dmg
rm -rf dmg-hazirlik
```


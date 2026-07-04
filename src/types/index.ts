// Rust tarafındaki DosyaDugumu struct'ının TypeScript karşılığı.
// İki taraftaki alan adları birebir eşleşmeli (camelCase çevirisiyle).
export interface DosyaDugumu {
  isim: string;      // Dosya/klasör adı
  yol: string;       // Diskteki tam yol — aynı zamanda benzersiz kimlik (ID) olarak kullanılır
  klasorMu: boolean; // true = klasör
  metinMi: boolean;  // true = editörde açılabilir metin dosyası (Rust karar verir)
}

// Rust'taki AramaSonucu struct'ının karşılığı
export interface AramaSonucu {
  yol: string;        // Dosyanın tam yolu (tıklayınca açmak için)
  isim: string;       // Dosya adı
  satirNo: number;    // Eşleşen satır numarası (0 = dosya ADI eşleşti)
  satirOzeti: string; // Eşleşen satırın kısaltılmış hali
}

// Açık bir sekmeyi temsil eder (Notepad++ mantığı)
export interface Sekme {
  yol: string;                        // Dosyanın tam yolu (benzersiz kimlik)
  baslik: string;                     // Sekmede görünen isim
  icerik: string;                     // Editördeki güncel içerik (disk formatında)
  kaydedilmemisDegisiklikVar: boolean; // true ise sekmede "●" işareti göster
  kodGorunumu: boolean;               // true = not dosyası (.html/.md) kod olarak gösteriliyor
}

// Kullanıcının oluşturduğu dosya kategorisi (renk + etiket)
export interface Kategori {
  id: string;   // Benzersiz kimlik (rastgele üretilir)
  isim: string; // Örn: "Önemli", "İş", "Arşiv"
  renk: string; // Hex renk kodu, örn: "#f59e0b"
}

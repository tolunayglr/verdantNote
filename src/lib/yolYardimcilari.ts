// ============================================================
// YOL YARDIMCILARI
// Dosya yollarıyla ilgili küçük yardımcı fonksiyonlar.
// Neden ayrı dosya? Aynı mantık birçok yerde lazım (sürükle-bırak,
// yeniden adlandırma, sekme güncelleme). Tek yerde toplarsak
// bir hata olursa tek yerden düzeltiriz.
// ============================================================

// macOS/Linux "/" kullanır, Windows "\" kullanır.
// Bu düzenli ifade (regex) ikisini de yakalar.
const YOL_AYIRICI = /[\\/]/;

// "/Users/ali/notlar/gunluk.html" → "gunluk.html"
export function dosyaAdi(yol: string): string {
  const parcalar = yol.split(YOL_AYIRICI);
  return parcalar[parcalar.length - 1] ?? yol;
}

// "/Users/ali/notlar/gunluk.html" → "/Users/ali/notlar"
export function ustKlasor(yol: string): string {
  const parcalar = yol.split(YOL_AYIRICI);
  parcalar.pop(); // Son parçayı (dosya adını) at
  return parcalar.join("/");
}

// ("/Users/ali/notlar", "yeni.html") → "/Users/ali/notlar/yeni.html"
export function yolBirlestir(klasor: string, isim: string): string {
  return `${klasor}/${isim}`;
}

// Bir yol, başka bir yolun içinde mi? (klasörü kendi içine taşımayı önlemek için)
// icindeMi("/a/b/c", "/a/b") → true
export function icindeMi(yol: string, olasiUstKlasor: string): boolean {
  return yol === olasiUstKlasor || yol.startsWith(olasiUstKlasor + "/");
}

// Dosya Markdown mı? Uzantıya göre karar veririz:
// .md dosyaları Markdown olarak, diğer her şey HTML olarak kaydedilir.
export function markdownMi(yol: string): boolean {
  return yol.toLowerCase().endsWith(".md");
}

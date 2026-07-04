// ============================================================
// DOSYA TÜRÜ KARARLARI
// "Bu dosya hangi görünümle açılmalı?" sorusunun tek cevap yeri.
//
// Kural basit:
//   .html ve .md  → zengin metin editörü (TipTap) — bunlar NOT dosyaları
//   diğer her şey → kod görüntüleyici (CodeMirror, renklendirme + katlama)
// Not dosyaları da istenirse kod görünümüne geçirilebilir (kaynağını görmek için).
// ============================================================

// Zengin metin editörüyle (TipTap) açılacak "not" uzantıları
const NOT_UZANTILARI = [".html", ".htm", ".md", ".markdown"];

export function zenginMetinMi(yol: string): boolean {
  const kucuk = yol.toLowerCase();
  return NOT_UZANTILARI.some((uzanti) => kucuk.endsWith(uzanti));
}

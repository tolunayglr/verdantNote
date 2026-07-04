// ============================================================
// GİRDİ MODALI — kullanıcıdan bir isim isteyen küçük pencere
// (yeni dosya, yeni klasör, yeniden adlandırma için ortak kullanılır)
//
// Neden tarayıcının prompt() fonksiyonunu kullanmıyoruz?
// Tauri'nin kullandığı sistem WebView'ında prompt() her platformda
// güvenilir çalışmaz. Kendi modalımız hem her yerde çalışır hem de
// uygulamanın görünümüyle uyumlu olur.
// ============================================================

import { useEffect, useRef, useState } from "react";

interface Props {
  baslik: string;             // Modal başlığı, örn: "Yeni Dosya"
  aciklama: string;           // Kısa yönlendirme metni
  baslangicDegeri: string;    // Yeniden adlandırmada mevcut isim gelir
  onaylaMetni: string;        // Onay düğmesinin yazısı, örn: "Oluştur"
  hata: string | null;        // İşlem başarısızsa gösterilecek mesaj
  onayla: (deger: string) => void;
  iptal: () => void;
}

export function GirdiModali({
  baslik,
  aciklama,
  baslangicDegeri,
  onaylaMetni,
  hata,
  onayla,
  iptal,
}: Props) {
  const [deger, setDeger] = useState(baslangicDegeri);
  const girdiRef = useRef<HTMLInputElement>(null);

  // Modal açılınca girdi kutusuna odaklan ve metni seçili getir
  // (kullanıcı hemen yazmaya başlayabilsin)
  useEffect(() => {
    girdiRef.current?.focus();
    girdiRef.current?.select();
  }, []);

  const gonder = () => {
    const temiz = deger.trim();
    if (temiz.length === 0) return; // Boş isimle onaylanamaz
    onayla(temiz);
  };

  return (
    // Arka plan karartması — dışına tıklanınca modal kapanır
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={iptal}
    >
      {/* Modalın kendisi — içine tıklama dışarıya yayılmasın */}
      <div
        className="w-80 rounded-lg border border-zinc-300 bg-white p-4 shadow-2xl dark:border-zinc-600 dark:bg-zinc-800"
        onClick={(olay) => olay.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{baslik}</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{aciklama}</p>

        <input
          ref={girdiRef}
          value={deger}
          onChange={(olay) => setDeger(olay.target.value)}
          onKeyDown={(olay) => {
            if (olay.key === "Enter") gonder();
            if (olay.key === "Escape") iptal();
          }}
          className="w-full rounded border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />

        {/* Hata varsa kırmızı göster */}
        {hata && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{hata}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={iptal}
            className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Vazgeç
          </button>
          <button
            onClick={gonder}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
          >
            {onaylaMetni}
          </button>
        </div>
      </div>
    </div>
  );
}

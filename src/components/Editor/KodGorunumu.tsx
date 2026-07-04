// ============================================================
// KOD GÖRÜNTÜLEYİCİ — CodeMirror 6 tabanlı kod editörü
//
// CodeMirror nedir? VS Code benzeri, tarayıcıda çalışan açık kaynak
// (MIT lisanslı, ücretsiz) kod editörü motoru. Bize hazır gelenler:
//   - Sözdizimi renklendirme (syntax highlighting) — VS Code temasıyla
//   - Satır numaraları
//   - Kod katlama (folding): XML/HTML etiketlerini, fonksiyonları,
//     JSON nesnelerini satır numarasının yanındaki ok ile açıp kapatma
//   - Arama, otomatik girinti, parantez eşleştirme...
// ============================================================

import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { languages } from "@codemirror/language-data";
import { LanguageDescription } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { useTemaDeposu } from "../../store/temaDeposu";
import { dosyaAdi } from "../../lib/yolYardimcilari";

interface Props {
  yol: string;                        // Hangi dosya? (dil seçimi dosya adından yapılır)
  icerik: string;                     // Gösterilecek metin
  degisti: (yeniIcerik: string) => void; // Kullanıcı yazınca çağrılır
}

export function KodGorunumu({ yol, icerik, degisti }: Props) {
  const koyuTema = useTemaDeposu((d) => d.koyuTema);

  // Dil paketi (renklendirme kuralları) dosya adına göre DİNAMİK yüklenir.
  // Neden dinamik? 100+ dilin kurallarını baştan yüklemek uygulamayı
  // şişirirdi; sadece açılan dosyanın dili indirilir (lazy loading).
  const [dilEklentisi, setDilEklentisi] = useState<Extension | null>(null);

  useEffect(() => {
    let iptalEdildi = false; // Sekme hızla değişirse eski yükleme sonucu uygulanmasın

    setDilEklentisi(null); // Önce temizle (önceki dosyanın dili kalmasın)

    // matchFilename: "notlar.xml" → XML dili, "main.py" → Python dili...
    // Uzantı tanınmıyorsa null döner → renklendirmesiz düz metin gösterilir.
    const dilTanimi = LanguageDescription.matchFilename(languages, dosyaAdi(yol));
    if (dilTanimi) {
      dilTanimi.load().then((dil) => {
        if (!iptalEdildi) setDilEklentisi(dil);
      });
    }

    return () => {
      iptalEdildi = true;
    };
  }, [yol]);

  return (
    <CodeMirror
      value={icerik}
      onChange={degisti}
      theme={koyuTema ? vscodeDark : vscodeLight}
      extensions={dilEklentisi ? [dilEklentisi] : []}
      height="100%"
      className="h-full overflow-hidden text-sm"
      basicSetup={{
        foldGutter: true,        // Kod katlama okları (XML etiketleri dahil)
        lineNumbers: true,       // Satır numaraları
        highlightActiveLine: true,
      }}
    />
  );
}

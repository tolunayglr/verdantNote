// ============================================================
// EDİTÖR — dosya türüne göre doğru görünümü seçer
//
//   .html / .md  → TipTap zengin metin editörü (not yazma modu)
//   diğer dosyalar → CodeMirror kod görüntüleyici (renklendirme + katlama)
//
// Not dosyalarında sağ üstteki </> düğmesiyle kaynak koda geçilebilir
// (örn: notun HTML'ini görmek için).
// ============================================================

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import { CodeXml, Eye } from "lucide-react";
import { useUygulamaDeposu } from "../../store/uygulamaDeposu";
import { markdownMi } from "../../lib/yolYardimcilari";
import { zenginMetinMi } from "../../lib/dosyaTurleri";
import { AracCubugu } from "./AracCubugu";
import { KodGorunumu } from "./KodGorunumu";

export function Editor() {
  const sekmeler = useUygulamaDeposu((d) => d.sekmeler);
  const aktifSekmeYolu = useUygulamaDeposu((d) => d.aktifSekmeYolu);
  const icerikGuncelle = useUygulamaDeposu((d) => d.icerikGuncelle);
  const gorunumModunuDegistir = useUygulamaDeposu((d) => d.gorunumModunuDegistir);

  const aktifSekme = sekmeler.find((sekme) => sekme.yol === aktifSekmeYolu);

  // Bu sekme not dosyası mı? (zengin metin editörü kullanabilir mi?)
  const notDosyasi = aktifSekme ? zenginMetinMi(aktifSekme.yol) : false;
  // Şu an zengin metin mi gösterilecek, kod mu?
  const zenginGoster = notDosyasi && !aktifSekme?.kodGorunumu;

  const editor = useEditor({
    extensions: [
      StarterKit, // Kalın, italik, başlıklar, listeler, kod bloğu...
      Markdown,   // .md dosyaları için Markdown okuma/yazma yeteneği
      // allowBase64: yapıştırılan görseller "data:" adresi olarak
      // doğrudan notun içine gömülür (ayrı dosya yönetimi gerekmez)
      Image.configure({ allowBase64: true }),
    ],
    content: "",
    // Kullanıcı her yazdığında store'daki içeriği güncelle.
    // ÖNEMLİ: içerik, dosyanın DİSK formatında saklanır —
    // .md dosyası için Markdown metni, diğerleri için HTML.
    onUpdate: ({ editor }) => {
      if (aktifSekmeYolu && zenginMetinMi(aktifSekmeYolu)) {
        const icerik = markdownMi(aktifSekmeYolu)
          ? editor.getMarkdown()
          : editor.getHTML();
        icerikGuncelle(aktifSekmeYolu, icerik);
      }
    },
    editorProps: {
      attributes: {
        // "prose" sınıfı Tailwind Typography ile güzel varsayılan stiller verir;
        // dark:prose-invert → koyu temada renkler otomatik ters çevrilir
        class: "prose dark:prose-invert max-w-none h-full p-6 focus:outline-none",
      },
      // --- PANODAN GÖRSEL YAPIŞTIRMA ---
      // Kullanıcı bir ekran görüntüsü/resim kopyalayıp Cmd/Ctrl+V yapınca
      // burası çalışır. Görseli base64 metnine çevirip editöre ekleriz.
      handlePaste: (gorunum, olay) => {
        const panoOgeleri = olay.clipboardData?.items;
        if (!panoOgeleri) return false;

        for (const oge of panoOgeleri) {
          if (!oge.type.startsWith("image/")) continue;

          const dosya = oge.getAsFile();
          if (!dosya) continue;

          // FileReader: tarayıcının dosya okuma aracı.
          // readAsDataURL → görseli "data:image/png;base64,..." metnine çevirir
          const okuyucu = new FileReader();
          okuyucu.onload = () => {
            const gorselAdresi = okuyucu.result as string;
            // ProseMirror düzeyinde görsel düğümü oluşturup imlecin yerine koy
            const gorselDugumu = gorunum.state.schema.nodes.image.create({
              src: gorselAdresi,
            });
            gorunum.dispatch(gorunum.state.tr.replaceSelectionWith(gorselDugumu));
          };
          okuyucu.readAsDataURL(dosya);

          return true; // "Bu yapıştırmayı biz hallettik" — varsayılan davranışı durdur
        }

        return false; // Görsel yok — normal metin yapıştırması devam etsin
      },
    },
  });

  // Sekme değişince editörün içeriğini yeni sekmenin içeriğiyle değiştir.
  // Sadece NOT dosyalarında gerekli — kod dosyalarını CodeMirror gösterir.
  useEffect(() => {
    if (editor && aktifSekme && zenginMetinMi(aktifSekme.yol)) {
      const mdMi = markdownMi(aktifSekme.yol);

      // Editördeki mevcut içeriği DİSK formatında üret ki karşılaştırma adil olsun
      const editordekiIcerik = mdMi ? editor.getMarkdown() : editor.getHTML();

      // İçerik zaten aynıysa dokunma (imleç konumu sıçramasın diye)
      if (editordekiIcerik !== aktifSekme.icerik) {
        editor.commands.setContent(aktifSekme.icerik, {
          // contentType: gelen metnin formatını söyler — Markdown metni
          // HTML sanılırsa düz yazı gibi görünür, bu yüzden şart
          contentType: mdMi ? "markdown" : "html",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktifSekmeYolu, editor]); // Sadece sekme DEĞİŞİNCE çalışır

  if (!aktifSekme) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
        Soldaki gezginden bir dosya açın 📄
      </div>
    );
  }

  // Not dosyalarında görünen "zengin metin ↔ kod" geçiş düğmesi
  const gecisDugmesi = notDosyasi ? (
    <button
      title={aktifSekme.kodGorunumu ? "Zengin metin görünümüne dön" : "Kaynak kodu göster"}
      onClick={() => gorunumModunuDegistir(aktifSekme.yol)}
      className="rounded p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
    >
      {aktifSekme.kodGorunumu ? <Eye size={15} /> : <CodeXml size={15} />}
    </button>
  ) : null;

  // --- KOD GÖRÜNÜMÜ (kod dosyaları + kaynak modundaki notlar) ---
  if (!zenginGoster) {
    return (
      <div className="flex h-full flex-col">
        {/* Not dosyası kod modundaysa üstte geri dönüş düğmesi göster */}
        {notDosyasi && (
          <div className="flex items-center justify-end border-b border-zinc-300 bg-zinc-100 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800">
            {gecisDugmesi}
          </div>
        )}
        <div className="min-h-0 flex-1">
          <KodGorunumu
            yol={aktifSekme.yol}
            icerik={aktifSekme.icerik}
            degisti={(yeniIcerik) => icerikGuncelle(aktifSekme.yol, yeniIcerik)}
          />
        </div>
      </div>
    );
  }

  // --- ZENGİN METİN GÖRÜNÜMÜ (not dosyaları) ---
  return (
    <div className="flex h-full flex-col">
      <AracCubugu editor={editor} sagTaraf={gecisDugmesi} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}

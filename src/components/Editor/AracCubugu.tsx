// ============================================================
// ARAÇ ÇUBUĞU — editörün üstündeki biçimlendirme düğmeleri
// (kalın, italik, başlıklar, listeler, alıntı, kod bloğu, geri al)
//
// useEditorState nedir? TipTap v3'te editörün anlık durumunu
// (imleç kalın metnin içinde mi? gibi) React'a bağlayan hook.
// Sadece seçtiğimiz değerler değişince yeniden çizim yapar — verimli.
// ============================================================

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
} from "lucide-react";

interface Props {
  editor: Editor | null; // Editör hazır olana kadar null gelebilir
  sagTaraf?: React.ReactNode; // Çubuğun sağ ucuna eklenecek düğmeler (görünüm geçişi vb.)
}

// Tek bir araç düğmesi — aktifse (imleç o biçimin içindeyse) mavi görünür
function AracDugmesi({
  aktif,
  baslik,
  tiklandi,
  children,
}: {
  aktif?: boolean;
  baslik: string; // Fareyle üzerine gelince görünen ipucu (tooltip)
  tiklandi: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={baslik}
      // onMouseDown + preventDefault: düğmeye tıklayınca editördeki
      // yazı imleci (focus) kaybolmasın — yoksa biçim uygulanacak yer belirsizleşir
      onMouseDown={(olay) => olay.preventDefault()}
      onClick={tiklandi}
      className={`rounded p-1.5 ${
        aktif
          ? "bg-blue-200 text-blue-700 dark:bg-blue-600/40 dark:text-blue-300"
          : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

export function AracCubugu({ editor, sagTaraf }: Props) {
  // Editörün anlık biçim durumu: her imleç hareketinde güncellenir
  const durum = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            kalin: e.isActive("bold"),
            italik: e.isActive("italic"),
            ustuCizili: e.isActive("strike"),
            baslik1: e.isActive("heading", { level: 1 }),
            baslik2: e.isActive("heading", { level: 2 }),
            baslik3: e.isActive("heading", { level: 3 }),
            maddeListesi: e.isActive("bulletList"),
            numaraliListe: e.isActive("orderedList"),
            alinti: e.isActive("blockquote"),
            kodBlogu: e.isActive("codeBlock"),
          }
        : null,
  });

  if (!editor || !durum) return null;

  // Kısayol: her komut "odaklan → biçimi uygula → çalıştır" zinciri
  const zincir = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-300 bg-zinc-100 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800">
      <AracDugmesi baslik="Kalın (Cmd/Ctrl+B)" aktif={durum.kalin} tiklandi={() => zincir().toggleBold().run()}>
        <Bold size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="İtalik (Cmd/Ctrl+I)" aktif={durum.italik} tiklandi={() => zincir().toggleItalic().run()}>
        <Italic size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Üstü Çizili" aktif={durum.ustuCizili} tiklandi={() => zincir().toggleStrike().run()}>
        <Strikethrough size={15} />
      </AracDugmesi>

      {/* Dikey ayırıcı çizgi */}
      <div className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

      <AracDugmesi baslik="Başlık 1" aktif={durum.baslik1} tiklandi={() => zincir().toggleHeading({ level: 1 }).run()}>
        <Heading1 size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Başlık 2" aktif={durum.baslik2} tiklandi={() => zincir().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Başlık 3" aktif={durum.baslik3} tiklandi={() => zincir().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={15} />
      </AracDugmesi>

      <div className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

      <AracDugmesi baslik="Madde Listesi" aktif={durum.maddeListesi} tiklandi={() => zincir().toggleBulletList().run()}>
        <List size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Numaralı Liste" aktif={durum.numaraliListe} tiklandi={() => zincir().toggleOrderedList().run()}>
        <ListOrdered size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Alıntı" aktif={durum.alinti} tiklandi={() => zincir().toggleBlockquote().run()}>
        <Quote size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Kod Bloğu" aktif={durum.kodBlogu} tiklandi={() => zincir().toggleCodeBlock().run()}>
        <Code size={15} />
      </AracDugmesi>

      <div className="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700" />

      <AracDugmesi baslik="Geri Al (Cmd/Ctrl+Z)" tiklandi={() => zincir().undo().run()}>
        <Undo2 size={15} />
      </AracDugmesi>
      <AracDugmesi baslik="Yinele (Cmd/Ctrl+Shift+Z)" tiklandi={() => zincir().redo().run()}>
        <Redo2 size={15} />
      </AracDugmesi>

      {/* Sağ uç: dışarıdan gelen ek düğmeler (ml-auto → sağa yasla) */}
      {sagTaraf && <div className="ml-auto flex items-center">{sagTaraf}</div>}
    </div>
  );
}

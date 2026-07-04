// ============================================================
// KAPANIŞ UYARISI
// Pencere kapatılırken kaydedilmemiş sekme varsa kullanıcıya sorar.
//
// Nasıl çalışıyor? Tauri, pencere kapatılmadan önce
// "close-requested" (kapatma istendi) olayını gönderir.
// preventDefault() çağırırsak kapanma İPTAL edilir.
// ============================================================

import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ask } from "@tauri-apps/plugin-dialog";
import { useUygulamaDeposu } from "../store/uygulamaDeposu";

export function useKapanisUyarisi() {
  useEffect(() => {
    const pencere = getCurrentWindow();

    // onCloseRequested bir "dinleyici kaldırma" fonksiyonu döndüren Promise verir
    const dinleyiciSozu = pencere.onCloseRequested(async (olay) => {
      // .getState(): Zustand deposunun ANLIK değerini hook kullanmadan okur
      const kirliSekmeler = useUygulamaDeposu
        .getState()
        .sekmeler.filter((sekme) => sekme.kaydedilmemisDegisiklikVar);

      if (kirliSekmeler.length === 0) return; // Her şey kayıtlı — kapanabilir

      // ask(): işletim sisteminin YEREL soru penceresi (Evet/Hayır)
      const yineDeKapat = await ask(
        `${kirliSekmeler.length} sekmede kaydedilmemiş değişiklik var.\n` +
          `Kapatırsanız bu değişiklikler kaybolur. Yine de çıkılsın mı?`,
        { title: "VerdantNote", kind: "warning" }
      );

      if (!yineDeKapat) {
        olay.preventDefault(); // Kapanmayı iptal et — kullanıcı vazgeçti
      }
    });

    // Temizlik: bileşen kaldırılırsa dinleyiciyi de kaldır
    return () => {
      dinleyiciSozu.then((dinleyiciyiKaldir) => dinleyiciyiKaldir());
    };
  }, []);
}

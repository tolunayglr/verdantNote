// ============================================================
// KLAVYE KISAYOLLARI
// Hook nedir? React'ta tekrar kullanılabilir mantık parçası;
// ismi her zaman "use" ile başlar.
// ============================================================

import { useEffect } from "react";
import { useUygulamaDeposu } from "../store/uygulamaDeposu";

// Cmd/Ctrl+S ile aktif sekmeyi kaydetme kısayolunu dinler
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

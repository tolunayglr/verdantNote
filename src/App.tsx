// ============================================================
// ANA YERLEŞİM (Layout)
// Solda dosya gezgini (sabit genişlik), sağda sekmeler + editör (esnek).
// ============================================================

import { useEffect } from "react";
import { FileExplorer } from "./components/FileExplorer/FileExplorer";
import { TabBar } from "./components/TabBar/TabBar";
import { Editor } from "./components/Editor/Editor";
import { useKlavyeKisayollari } from "./hooks/useKlavyeKisayollari";
import { useKapanisUyarisi } from "./hooks/useKapanisUyarisi";
import { useTemaDeposu } from "./store/temaDeposu";
import { useKategoriDeposu } from "./store/kategoriDeposu";
import "./App.css";

export default function App() {
  useKlavyeKisayollari(); // Cmd/Ctrl+S dinleyicisini başlat
  useKapanisUyarisi();    // Pencere kapanırken kaydedilmemiş sekme kontrolü

  const kayitliTemayiYukle = useTemaDeposu((d) => d.kayitliTemayiYukle);
  const kayitliKategorileriYukle = useKategoriDeposu((d) => d.kayitlilariYukle);

  // Açılışta kayıtlı tema ve kategori tercihlerini uygula (sadece 1 kez)
  useEffect(() => {
    kayitliTemayiYukle();
    kayitliKategorileriYukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <FileExplorer />
      <main className="flex flex-1 flex-col">
        <TabBar />
        <div className="flex-1 overflow-hidden">
          <Editor />
        </div>
      </main>
    </div>
  );
}

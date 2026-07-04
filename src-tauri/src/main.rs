// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Uygulamanın asıl mantığı lib.rs içinde — burası sadece başlatıcı
    verdantnote_lib::run()
}

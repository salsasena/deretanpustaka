# KlinikPustaka — Dynamic Bookstore (GitHub Pages + Google Sheets)

Website toko buku fiksi yang sudah siap pakai **Google Sheets** sebagai database gratis.

## Cara Cepat Setup

1. Upload semua file ini ke repository GitHub Pages (root)
2. Ikuti panduan di **SETUP_GOOGLE_SHEETS.md**
3. Ganti `API_URL` di `script.js` dengan URL deployment Apps Script

## Fitur

- Katalog buku dinamis dari Google Sheets
- Filter genre & search real-time
- Shopping cart + quantity
- Stok otomatis berkurang saat order
- Order tercatat di sheet Orders
- Checkout via WhatsApp
- Bahasa ID / EN
- Fallback offline jika API gagal

## Struktur Folder

```
├── index.html
├── style.css
├── script.js          ← ganti API_URL di sini
├── favicon.svg
├── CNAME
├── *.jpg              ← cover buku
├── SETUP_GOOGLE_SHEETS.md
├── README.md
└── templates/
    ├── Books.csv      ← data contoh
    ├── Orders.csv
    └── Code.gs        ← kode Apps Script
```

## Catatan

- Ganti nomor WhatsApp di `index.html` dan `script.js` jika perlu (saat ini placeholder 6281234567890)
- Instagram: @sallsna

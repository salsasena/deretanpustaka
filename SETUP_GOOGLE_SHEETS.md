# KlinikPustaka — Setup Google Sheets + Apps Script (Gratis)

## RINGKASAN LANGKAH (5-10 menit)

1. Buat Google Spreadsheet baru
2. Import / copy data dari folder `templates/`
3. Paste kode dari `templates/Code.gs` ke Apps Script
4. Deploy Web App
5. Ganti `API_URL` di `script.js`
6. Push ke GitHub

---

## LANGKAH DETAIL

### 1. Buat Spreadsheet

1. Buka https://sheets.google.com → **Blank**
2. Rename spreadsheet jadi **`KlinikPustaka DB`**
3. Rename sheet `Sheet1` → **`Books`**
4. Buat sheet baru → namai **`Orders`**

### 2. Isi Sheet `Books`

**Cara termudah:**
- Buka file `templates/Books.csv` di komputer
- Select All → Copy
- Di Google Sheets (sheet Books) → klik sel A1 → Paste

Atau ketik manual header di baris 1:

```
id | title | author | genre | price | stock | cover | rating | description | status | tags
```

Lalu isi data buku (mulai baris 2).

### 3. Isi Sheet `Orders`

Header saja di baris 1:

```
order_id | timestamp | customer_name | whatsapp | items | total | status | notes
```

(biarkan kosong, nanti otomatis terisi)

### 4. Ambil Spreadsheet ID

Lihat URL browser kamu, contoh:

```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

ID-nya adalah bagian tengah:  
`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 5. Deploy Apps Script

1. Di spreadsheet → **Extensions → Apps Script**
2. Hapus semua kode yang ada
3. Buka file `templates/Code.gs` → **Copy semua isinya** → Paste di Apps Script
4. Ganti baris ini:

```js
const SPREADSHEET_ID = 'PASTE_ID_SPREADSHEET_KAMU_DI_SINI';
```

dengan ID yang kamu ambil tadi.

5. Klik **Deploy** (kanan atas) → **New deployment**
6. Klik ikon gear → pilih **Web app**
7. Isi:
   - Description: `KlinikPustaka API`
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Klik **Deploy**
9. **Copy** Web app URL (bentuknya `https://script.google.com/macros/s/AKfycb.../exec`)

### 6. Update Frontend

1. Buka file `script.js`
2. Ganti baris ini:

```js
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

dengan URL yang kamu copy dari deployment.

3. Save → commit → push ke GitHub Pages.

---

## Testing

1. Buka website → tekan F12 (Console)
2. Harusnya muncul: `✅ Books loaded from Google Sheets: 6`
3. Tambah buku ke keranjang → klik “Pesan via WhatsApp”
4. Cek sheet **Orders** → muncul baris baru
5. Cek sheet **Books** → stok berkurang

---

## File yang Ada di Folder `templates/`

| File          | Fungsi                                      |
|---------------|---------------------------------------------|
| `Books.csv`   | Data contoh buku (tinggal import)           |
| `Orders.csv`  | Header untuk sheet Orders                   |
| `Code.gs`     | Kode Apps Script lengkap (siap paste)       |

---

## Troubleshooting

| Masalah                        | Solusi                                      |
|--------------------------------|---------------------------------------------|
| Console bilang “Mode offline”  | Cek API_URL sudah diganti & deployment “Anyone” |
| Order tidak masuk sheet        | Cek Execution log di Apps Script            |
| Cover tidak muncul             | Pastikan nama file cover sama dengan di repo |
| CORS error                     | Sudah diatasi dengan `mode: 'no-cors'`      |

Selesai! Website kamu sekarang pakai database gratis.

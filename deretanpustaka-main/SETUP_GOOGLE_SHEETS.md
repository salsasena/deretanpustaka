# KlinikPustaka — Setup Lengkap (Google Sheets + Apps Script + Admin)

## 1. Google Spreadsheet

Buat spreadsheet bernama **KlinikPustaka DB** dengan 2 sheet:

### Sheet `Books` (header baris 1)
```
id | title | author | genre | price | stock | cover | rating | description | status | tags
```

Isi data buku mulai baris 2.

### Sheet `Orders` (header baris 1)
```
order_id | timestamp | customer_name | whatsapp | items | total | status | notes
```

---

## 2. Apps Script

1. Di spreadsheet → **Extensions → Apps Script**
2. Hapus semua kode default
3. Paste **seluruh** isi file `templates/Code.gs`
4. **Save**

### Set Script Properties (PENTING — rahasia tidak di kode)

1. Di Apps Script, klik ikon **gear** (Project Settings) di kiri
2. Scroll ke **Script Properties**
3. Klik **Add script property**, tambahkan 2 baris:

| Property          | Value                                      |
|-------------------|--------------------------------------------|
| `SPREADSHEET_ID`  | ID spreadsheet kamu (dari URL)             |
| `ADMIN_PASSWORD`  | `Bismillaah`                               |

4. Save properties

### Deploy

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Deploy → Authorize → Copy **Web app URL**

---

## 3. Frontend (script.js)

Buka `script.js`, pastikan baris API_URL berisi URL deployment kamu:

```js
const API_URL = 'https://script.google.com/.../exec';
```

**Jangan** taruh password atau Spreadsheet ID di file frontend.

---

## 4. Testing

1. Buka website → Console (F12) harus muncul: `✅ Books loaded from Google Sheets: X`
2. Klik ikon ⚙ di header → masukkan password `Bismillaah`
3. Bisa CRUD buku & lihat/update order

---

## Fitur yang aktif

- Katalog dinamis dari Sheets
- Filter genre + search
- Cart + quantity
- Order masuk ke sheet + stok otomatis berkurang
- Admin Panel (password: Bismillaah)
  - CRUD Buku (Create, Read, Update, Delete)
  - Lihat & update status Order
  - Hapus Order
- Secrets di Script Properties (aman untuk GitHub Pages)

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "SPREADSHEET_ID belum di-set" | Isi Script Properties |
| Password salah | Pastikan ADMIN_PASSWORD = Bismillaah di Script Properties |
| Mode offline | Cek API_URL + Deploy "Anyone" + Redeploy setelah ubah kode |
| CORS / POST gagal | Redeploy, pastikan Execute as: Me |

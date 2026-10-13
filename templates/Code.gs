/**
 * KlinikPustaka — Google Apps Script Backend
 * ==========================================
 * Cara pakai:
 * 1. Buka spreadsheet KlinikPustaka DB
 * 2. Extensions → Apps Script
 * 3. Hapus kode default, paste SEMUA kode ini
 * 4. Ganti SPREADSHEET_ID di bawah
 * 5. Deploy → New deployment → Web app → Anyone
 */

const SPREADSHEET_ID = 'PASTE_ID_SPREADSHEET_KAMU_DI_SINI'; // ← WAJIB DIGANTI
const BOOKS_SHEET = 'Books';
const ORDERS_SHEET = 'Orders';

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'books';
  try {
    if (action === 'books') return getBooks();
    if (action === 'book') return getBookById(e.parameter.id);
    return jsonResponse({ error: 'Action tidak dikenal' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'create_order') return createOrder(data);
    return jsonResponse({ error: 'Action tidak dikenal' });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getBooks() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const books = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  }).filter(b => b.status !== 'Hidden' && b.id !== '');

  return jsonResponse({ success: true, books: books });
}

function getBookById(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const book = data.slice(1).find(row => String(row[0]) === String(id));
  if (!book) return jsonResponse({ error: 'Buku tidak ditemukan' });

  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = book[i];
  });
  return jsonResponse({ success: true, book: obj });
}

function createOrder(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ORDERS_SHEET);

  const orderId = 'KP-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

  // Kurangi stok
  if (data.items && data.items.length > 0) {
    decreaseStock(data.items);
  }

  sheet.appendRow([
    orderId,
    timestamp,
    data.customer_name || '',
    data.whatsapp || '',
    JSON.stringify(data.items || []),
    data.total || 0,
    'Pending',
    data.notes || ''
  ]);

  return jsonResponse({
    success: true,
    order_id: orderId,
    message: 'Order berhasil dibuat'
  });
}

function decreaseStock(items) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const data = sheet.getDataRange().getValues();

  items.forEach(item => {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(item.id)) {
        const currentStock = Number(data[i][5]) || 0; // kolom F = stock (index 5)
        const newStock = Math.max(0, currentStock - (item.qty || 1));
        sheet.getRange(i + 1, 6).setValue(newStock);

        if (newStock === 0) {
          sheet.getRange(i + 1, 10).setValue('Sold Out'); // kolom J = status (index 9 → range 10)
        }
        break;
      }
    }
  });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Fungsi test (opsional, bisa dijalankan dari editor)
function testGetBooks() {
  const result = getBooks();
  Logger.log(result.getContent());
}

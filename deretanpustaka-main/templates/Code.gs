/**
 * KlinikPustaka — Google Apps Script Backend (v2)
 * ================================================
 * SECRETS disimpan di Script Properties (bukan di kode)
 *
 * Cara setup Script Properties:
 * 1. Di Apps Script → Project Settings (ikon gear kiri)
 * 2. Scroll ke "Script Properties"
 * 3. Tambah 2 property:
 *    - SPREADSHEET_ID  = ID spreadsheet kamu
 *    - ADMIN_PASSWORD  = Bismillaah
 * 4. Deploy ulang sebagai Web App (Anyone)
 */

const BOOKS_SHEET  = 'Books';
const ORDERS_SHEET = 'Orders';

/* ---------- Helpers ---------- */
function getProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

function getSpreadsheet() {
  const id = getProp('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID belum di-set di Script Properties');
  return SpreadsheetApp.openById(id);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkAdmin(password) {
  const stored = getProp('ADMIN_PASSWORD') || 'Bismillaah';
  return password && password === stored;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1)
    .filter(row => row[0] !== '' && row[0] !== null)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

/* ---------- doGet ---------- */
function doGet(e) {
  const p = e.parameter || {};
  const action = p.action || 'books';

  try {
    // Public
    if (action === 'books') return getBooks();
    if (action === 'book')  return getBookById(p.id);
    if (action === 'ping')  return jsonResponse({ success: true, message: 'API hidup' });

    // Admin (butuh password)
    if (action === 'admin_login') {
      if (checkAdmin(p.password)) {
        return jsonResponse({ success: true, message: 'Login berhasil' });
      }
      return jsonResponse({ success: false, error: 'Password salah' });
    }

    if (action === 'admin_books') {
      if (!checkAdmin(p.password)) return jsonResponse({ success: false, error: 'Unauthorized' });
      return getBooks(true);
    }

    if (action === 'admin_orders') {
      if (!checkAdmin(p.password)) return jsonResponse({ success: false, error: 'Unauthorized' });
      return getOrders();
    }

    return jsonResponse({ error: 'Action tidak dikenal: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/* ---------- doPost ---------- */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // Public
    if (action === 'create_order') return createOrder(data);

    // Admin actions
    if (!checkAdmin(data.password)) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    if (action === 'create_book')  return createBook(data);
    if (action === 'update_book')  return updateBook(data);
    if (action === 'delete_book')  return deleteBook(data);
    if (action === 'update_order') return updateOrder(data);
    if (action === 'delete_order') return deleteOrder(data);

    return jsonResponse({ success: false, error: 'Action tidak dikenal' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/* ---------- Books ---------- */
function getBooks(includeHidden) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  let books = sheetToObjects(sheet);

  if (!includeHidden) {
    books = books.filter(b => String(b.status || '').toLowerCase() !== 'hidden');
  }

  return jsonResponse({ success: true, books: books });
}

function getBookById(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const books = sheetToObjects(sheet);
  const book = books.find(b => String(b.id) === String(id));
  if (!book) return jsonResponse({ success: false, error: 'Buku tidak ditemukan' });
  return jsonResponse({ success: true, book: book });
}

function createBook(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const books = sheetToObjects(sheet);

  let maxId = 0;
  books.forEach(b => {
    const n = Number(b.id) || 0;
    if (n > maxId) maxId = n;
  });
  const newId = maxId + 1;

  sheet.appendRow([
    newId,
    data.title || '',
    data.author || '',
    data.genre || '',
    Number(data.price) || 0,
    Number(data.stock) || 0,
    data.cover || '',
    Number(data.rating) || 4.8,
    data.description || '',
    data.status || 'Available',
    data.tags || ''
  ]);

  return jsonResponse({ success: true, id: newId, message: 'Buku ditambahkan' });
}

function updateBook(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());

  const idCol = headers.indexOf('id');
  if (idCol === -1) throw new Error('Kolom id tidak ditemukan');

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.id)) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) return jsonResponse({ success: false, error: 'Buku tidak ditemukan' });

  const map = {
    title: data.title,
    author: data.author,
    genre: data.genre,
    price: data.price,
    stock: data.stock,
    cover: data.cover,
    rating: data.rating,
    description: data.description,
    status: data.status,
    tags: data.tags
  };

  Object.keys(map).forEach(key => {
    if (map[key] !== undefined && map[key] !== null) {
      const col = headers.indexOf(key);
      if (col !== -1) {
        sheet.getRange(rowIndex, col + 1).setValue(map[key]);
      }
    }
  });

  return jsonResponse({ success: true, message: 'Buku diupdate' });
}

function deleteBook(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const idCol = headers.indexOf('id');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true, message: 'Buku dihapus' });
    }
  }
  return jsonResponse({ success: false, error: 'Buku tidak ditemukan' });
}

/* ---------- Orders ---------- */
function getOrders() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(ORDERS_SHEET);
  const orders = sheetToObjects(sheet);
  return jsonResponse({ success: true, orders: orders });
}

function createOrder(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(ORDERS_SHEET);

  const orderId = 'KP-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss');
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

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

function updateOrder(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(ORDERS_SHEET);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const idCol = headers.indexOf('order_id');

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.order_id)) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) return jsonResponse({ success: false, error: 'Order tidak ditemukan' });

  if (data.status !== undefined) {
    const col = headers.indexOf('status');
    if (col !== -1) sheet.getRange(rowIndex, col + 1).setValue(data.status);
  }
  if (data.notes !== undefined) {
    const col = headers.indexOf('notes');
    if (col !== -1) sheet.getRange(rowIndex, col + 1).setValue(data.notes);
  }

  return jsonResponse({ success: true, message: 'Order diupdate' });
}

function deleteOrder(data) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(ORDERS_SHEET);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const idCol = headers.indexOf('order_id');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.order_id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true, message: 'Order dihapus' });
    }
  }
  return jsonResponse({ success: false, error: 'Order tidak ditemukan' });
}

function decreaseStock(items) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(BOOKS_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idCol = headers.indexOf('id');
  const stockCol = headers.indexOf('stock');
  const statusCol = headers.indexOf('status');

  items.forEach(item => {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(item.id)) {
        const current = Number(data[i][stockCol]) || 0;
        const next = Math.max(0, current - (item.qty || 1));
        sheet.getRange(i + 1, stockCol + 1).setValue(next);
        if (next === 0 && statusCol !== -1) {
          sheet.getRange(i + 1, statusCol + 1).setValue('Sold Out');
        }
        break;
      }
    }
  });
}

/* =========================================================
   KlinikPustaka — Dynamic + Admin Panel (v2)
   ========================================================= */

// GANTI dengan URL Web App deployment kamu
const API_URL = 'https://script.google.com/a/macros/sma.belajar.id/s/AKfycbw24lJ4CDvQJ4ZvBKf2J3ZQ71Bv7e67PGVBIZxSABvswHwCvL6EB8iVBjlC0skxX_jOuQ/exec';

const FALLBACK_BOOKS = [
  { id: 1, title: 'Kita Pergi Hari Ini', author: '', genre: 'Slice of Life', price: 89000, stock: 10, cover: 'Kita_Pergi_Hari_Ini.jpg', rating: 4.9, status: 'Available' },
  { id: 2, title: 'Perempuan di Titik Nol', author: '', genre: 'Classic', price: 119000, stock: 8, cover: 'Perempuan_di_Titik_Nol.jpg', rating: 4.9, status: 'Available' },
  { id: 3, title: 'Hello, Cello!', author: '', genre: 'Romance', price: 125000, stock: 15, cover: 'Hello_Cello.jpg', rating: 4.9, status: 'Available' },
  { id: 4, title: 'Autumn in Paris', author: '', genre: 'Romance', price: 139000, stock: 7, cover: 'Autumn_in_Paris.jpg', rating: 4.9, status: 'Available' },
  { id: 5, title: 'Surat Untuk Jenaka', author: '', genre: 'Romance', price: 129000, stock: 12, cover: 'Surat_Untuk_Jenaka.jpg', rating: 4.9, status: 'Available' },
  { id: 6, title: 'Cantik Itu Luka', author: '', genre: 'Classic', price: 149000, stock: 5, cover: 'Cantik_Itu_Luka.jpg', rating: 4.9, status: 'Available' }
];

let books = [];
let cart = JSON.parse(localStorage.getItem('kpCart') || '[]');
let adminPassword = sessionStorage.getItem('kpAdminPass') || '';
let adminBooks = [];
let adminOrders = [];

const $ = id => document.getElementById(id);
const slider = $('slider');

/* ---------- Toast ---------- */
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- API Helpers ---------- */
async function apiGet(action, extra = {}) {
  const params = new URLSearchParams({ action, ...extra });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
}

async function apiPost(payload) {
  // Apps Script often needs no-cors for POST from browser; response may be opaque
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    // Try to parse if possible
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { success: true }; }
  } catch (err) {
    // Fallback no-cors (fire & forget)
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return { success: true, note: 'no-cors' };
  }
}

/* ---------- Load Books (Public) ---------- */
async function loadBooks() {
  try {
    slider.innerHTML = `<div style="padding:40px;text-align:center;color:#806c73">Memuat koleksi...</div>`;
    const json = await apiGet('books');

    if (json.success && Array.isArray(json.books) && json.books.length > 0) {
      books = json.books.map(normalizeBook);
      console.log('✅ Books loaded from Google Sheets:', books.length);
      if ($('statBooks')) $('statBooks').textContent = String(books.length).padStart(2, '0');
    } else {
      throw new Error(json.error || 'Data kosong');
    }
  } catch (err) {
    console.warn('⚠️ Gagal load dari API, pakai fallback:', err.message);
    books = FALLBACK_BOOKS;
    toast('Mode offline — data lokal');
  }
  renderBooks(books);
  updateCartUI();
}

function normalizeBook(b) {
  return {
    id: Number(b.id),
    title: b.title || '',
    author: b.author || '',
    genre: b.genre || '',
    price: Number(b.price) || 0,
    stock: Number(b.stock) || 0,
    cover: b.cover || '',
    rating: Number(b.rating) || 4.8,
    status: b.status || 'Available',
    description: b.description || '',
    tags: b.tags || ''
  };
}

/* ---------- Render Books ---------- */
function renderBooks(list = books) {
  if (!list.length) {
    slider.innerHTML = `<div style="padding:40px;text-align:center;color:#806c73">Belum ada buku tersedia ♡</div>`;
    return;
  }
  slider.innerHTML = list.map(b => {
    const isSoldOut = b.status === 'Sold Out' || b.stock <= 0;
    return `
      <article class="card" data-id="${b.id}">
        <img class="cover" src="${b.cover}" alt="${b.title}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'">
        <h3>${b.title}</h3>
        <p>${b.genre}${b.author ? ' · ' + b.author : ''} · ⭐ ${b.rating}</p>
        <span class="price"><b>Rp${b.price.toLocaleString('id-ID')}</b></span>
        ${isSoldOut
          ? `<button class="buy soldout" disabled>Sold Out</button>`
          : `<button class="buy" onclick="addToCart(${b.id})">Tambah ke Keranjang</button>`}
      </article>`;
  }).join('');
}

/* ---------- Cart ---------- */
function addToCart(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  if (book.stock <= 0 || book.status === 'Sold Out') {
    toast('Stok habis 😢');
    return;
  }
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ id: book.id, title: book.title, genre: book.genre, price: book.price, cover: book.cover, qty: 1 });
  saveCart();
  updateCartUI();
  toast('♡ Buku ditambahkan ke keranjang');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  toast('Buku dihapus');
}

function changeQty(index, delta) {
  cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('kpCart', JSON.stringify(cart));
}

function updateCartUI() {
  $('cartCount').textContent = cart.reduce((s, i) => s + (i.qty || 1), 0);
  if (!cart.length) {
    $('cartItems').innerHTML = '<p>Belum ada buku. Yuk cari cerita baru ♡</p>';
    $('cartTotal').textContent = 'Rp0';
    return;
  }
  $('cartItems').innerHTML = cart.map((item, i) => `
    <div class="cartrow">
      <div>
        <b>${item.title}</b>
        <div class="qty">
          ${item.genre} · Rp${item.price.toLocaleString('id-ID')}<br>
          <button onclick="changeQty(${i},-1)">−</button>
          ${item.qty || 1}
          <button onclick="changeQty(${i},1)">+</button>
        </div>
      </div>
      <button onclick="removeFromCart(${i})">×</button>
    </div>`).join('');
  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  $('cartTotal').textContent = 'Rp' + total.toLocaleString('id-ID');
}

/* ---------- Checkout ---------- */
async function checkout() {
  if (!cart.length) {
    toast('Keranjang masih kosong ♡');
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  const itemsText = cart
    .map(i => `• ${i.title} x${i.qty || 1} — Rp${(i.price * (i.qty || 1)).toLocaleString('id-ID')}`)
    .join('%0A');

  const orderPayload = {
    action: 'create_order',
    customer_name: '',
    whatsapp: '',
    items: cart.map(i => ({ id: i.id, title: i.title, qty: i.qty || 1, price: i.price })),
    total,
    notes: ''
  };

  try {
    await apiPost(orderPayload);
    console.log('Order dikirim ke Google Sheets');
  } catch (err) {
    console.warn('Gagal kirim order:', err);
  }

  const waUrl =
    `https://wa.me/6281234567890?text=` +
    `Halo%20KlinikPustaka%2C%20saya%20ingin%20memesan%3A%0A` +
    `${itemsText}%0A%0ATotal%3A%20Rp${total.toLocaleString('id-ID')}`;
  window.open(waUrl, '_blank');
}

/* ---------- Admin Panel ---------- */
function openAdmin() {
  $('adminOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (adminPassword) {
    showAdminDash();
  } else {
    $('adminLogin').style.display = 'block';
    $('adminDash').style.display = 'none';
    $('adminPassword').value = '';
    $('adminLoginError').textContent = '';
  }
}

function closeAdmin() {
  $('adminOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function adminLogin() {
  const pass = $('adminPassword').value.trim();
  if (!pass) {
    $('adminLoginError').textContent = 'Masukkan password';
    return;
  }
  try {
    const json = await apiGet('admin_login', { password: pass });
    if (json.success) {
      adminPassword = pass;
      sessionStorage.setItem('kpAdminPass', pass);
      showAdminDash();
      toast('Login berhasil');
    } else {
      $('adminLoginError').textContent = json.error || 'Password salah';
    }
  } catch (err) {
    $('adminLoginError').textContent = 'Gagal terhubung ke server';
  }
}

function showAdminDash() {
  $('adminLogin').style.display = 'none';
  $('adminDash').style.display = 'block';
  loadAdminBooks();
}

function adminLogout() {
  adminPassword = '';
  sessionStorage.removeItem('kpAdminPass');
  $('adminLogin').style.display = 'block';
  $('adminDash').style.display = 'none';
  $('adminPassword').value = '';
  toast('Logout');
}

/* Admin Books CRUD */
async function loadAdminBooks() {
  $('adminBooksTable').innerHTML = '<p style="padding:20px;color:#806c73">Memuat...</p>';
  try {
    const json = await apiGet('admin_books', { password: adminPassword });
    if (json.success) {
      adminBooks = (json.books || []).map(normalizeBook);
      renderAdminBooks();
    } else {
      $('adminBooksTable').innerHTML = `<p class="admin-error">${json.error || 'Gagal memuat'}</p>`;
    }
  } catch (err) {
    $('adminBooksTable').innerHTML = `<p class="admin-error">Error: ${err.message}</p>`;
  }
}

function renderAdminBooks() {
  if (!adminBooks.length) {
    $('adminBooksTable').innerHTML = '<p style="padding:20px">Belum ada buku. Klik + Tambah Buku.</p>';
    return;
  }
  $('adminBooksTable').innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>ID</th><th>Judul</th><th>Genre</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${adminBooks.map(b => `
          <tr>
            <td>${b.id}</td>
            <td><b>${b.title}</b></td>
            <td>${b.genre}</td>
            <td>Rp${b.price.toLocaleString('id-ID')}</td>
            <td>${b.stock}</td>
            <td><span class="badge ${b.status === 'Sold Out' ? 'badge-red' : 'badge-green'}">${b.status}</span></td>
            <td class="actions-cell">
              <button class="btn-icon" onclick="editBook(${b.id})" title="Edit">✎</button>
              <button class="btn-icon danger" onclick="deleteBook(${b.id})" title="Hapus">🗑</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function openBookForm(book) {
  $('bookFormModal').style.display = 'flex';
  if (book) {
    $('bookFormTitle').textContent = 'Edit Buku';
    $('bf_id').value = book.id;
    $('bf_title').value = book.title;
    $('bf_author').value = book.author || '';
    $('bf_genre').value = book.genre;
    $('bf_price').value = book.price;
    $('bf_stock').value = book.stock;
    $('bf_cover').value = book.cover || '';
    $('bf_rating').value = book.rating || 4.8;
    $('bf_status').value = book.status || 'Available';
    $('bf_description').value = book.description || '';
  } else {
    $('bookFormTitle').textContent = 'Tambah Buku';
    $('bookForm').reset();
    $('bf_id').value = '';
    $('bf_rating').value = 4.8;
    $('bf_status').value = 'Available';
  }
}

function closeBookForm() {
  $('bookFormModal').style.display = 'none';
}

function editBook(id) {
  const book = adminBooks.find(b => b.id === id);
  if (book) openBookForm(book);
}

async function deleteBook(id) {
  if (!confirm('Yakin hapus buku ini?')) return;
  try {
    const json = await apiPost({ action: 'delete_book', password: adminPassword, id });
    if (json.success || json.note === 'no-cors') {
      toast('Buku dihapus');
      loadAdminBooks();
      loadBooks(); // refresh public
    } else {
      toast(json.error || 'Gagal menghapus');
    }
  } catch (err) {
    toast('Error: ' + err.message);
  }
}

async function saveBook(e) {
  e.preventDefault();
  const payload = {
    password: adminPassword,
    title: $('bf_title').value.trim(),
    author: $('bf_author').value.trim(),
    genre: $('bf_genre').value.trim(),
    price: Number($('bf_price').value),
    stock: Number($('bf_stock').value),
    cover: $('bf_cover').value.trim(),
    rating: Number($('bf_rating').value) || 4.8,
    status: $('bf_status').value,
    description: $('bf_description').value.trim()
  };

  const id = $('bf_id').value;
  if (id) {
    payload.action = 'update_book';
    payload.id = Number(id);
  } else {
    payload.action = 'create_book';
  }

  try {
    const json = await apiPost(payload);
    if (json.success || json.note === 'no-cors') {
      toast(id ? 'Buku diupdate' : 'Buku ditambahkan');
      closeBookForm();
      loadAdminBooks();
      loadBooks();
    } else {
      toast(json.error || 'Gagal menyimpan');
    }
  } catch (err) {
    toast('Error: ' + err.message);
  }
}

/* Admin Orders */
async function loadAdminOrders() {
  $('adminOrdersTable').innerHTML = '<p style="padding:20px;color:#806c73">Memuat...</p>';
  try {
    const json = await apiGet('admin_orders', { password: adminPassword });
    if (json.success) {
      adminOrders = json.orders || [];
      renderAdminOrders();
    } else {
      $('adminOrdersTable').innerHTML = `<p class="admin-error">${json.error || 'Gagal memuat'}</p>`;
    }
  } catch (err) {
    $('adminOrdersTable').innerHTML = `<p class="admin-error">Error: ${err.message}</p>`;
  }
}

function renderAdminOrders() {
  if (!adminOrders.length) {
    $('adminOrdersTable').innerHTML = '<p style="padding:20px">Belum ada order.</p>';
    return;
  }
  $('adminOrdersTable').innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Order ID</th><th>Waktu</th><th>Customer</th><th>Total</th><th>Status</th><th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${adminOrders.map(o => {
          let itemsPreview = '';
          try {
            const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
            itemsPreview = (items || []).map(i => i.title + ' x' + (i.qty || 1)).join(', ');
          } catch { itemsPreview = o.items || ''; }
          return `
          <tr>
            <td><b>${o.order_id || ''}</b></td>
            <td>${o.timestamp || ''}</td>
            <td>${o.customer_name || '-'}<br><small>${o.whatsapp || ''}</small></td>
            <td>Rp${Number(o.total || 0).toLocaleString('id-ID')}</td>
            <td>
              <select onchange="updateOrderStatus('${o.order_id}', this.value)" class="status-select">
                <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Done" ${o.status === 'Done' ? 'selected' : ''}>Done</option>
                <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td class="actions-cell">
              <button class="btn-icon" onclick="alert('Items: ${itemsPreview.replace(/'/g, "\\'")}')" title="Detail">👁</button>
              <button class="btn-icon danger" onclick="deleteOrder('${o.order_id}')" title="Hapus">🗑</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

async function updateOrderStatus(orderId, status) {
  try {
    const json = await apiPost({
      action: 'update_order',
      password: adminPassword,
      order_id: orderId,
      status
    });
    if (json.success || json.note === 'no-cors') {
      toast('Status diupdate');
    } else {
      toast(json.error || 'Gagal update');
      loadAdminOrders();
    }
  } catch (err) {
    toast('Error: ' + err.message);
  }
}

async function deleteOrder(orderId) {
  if (!confirm('Yakin hapus order ' + orderId + '?')) return;
  try {
    const json = await apiPost({
      action: 'delete_order',
      password: adminPassword,
      order_id: orderId
    });
    if (json.success || json.note === 'no-cors') {
      toast('Order dihapus');
      loadAdminOrders();
    } else {
      toast(json.error || 'Gagal hapus');
    }
  } catch (err) {
    toast('Error: ' + err.message);
  }
}

/* ---------- Event Listeners ---------- */
$('next').onclick = () => slider.scrollBy({ left: 260, behavior: 'smooth' });
$('prev').onclick = () => slider.scrollBy({ left: -260, behavior: 'smooth' });

let autoSlide = setInterval(() => $('next').click(), 4500);
slider.addEventListener('mouseenter', () => clearInterval(autoSlide));
slider.addEventListener('mouseleave', () => {
  autoSlide = setInterval(() => $('next').click(), 4500);
});

$('cartBtn').onclick = () => {
  $('cartPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
};
$('closeCart').onclick = () => {
  $('cartPanel').classList.remove('open');
  document.body.style.overflow = '';
};

$('searchBtn').onclick = () => {
  $('searchPanel').classList.toggle('open');
  if ($('searchPanel').classList.contains('open')) {
    $('searchPanel').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('searchInput').focus(), 400);
  }
};

$('searchInput').oninput = e => {
  const q = e.target.value.toLowerCase().trim();
  const results = books.filter(b =>
    (b.title + ' ' + b.genre + ' ' + (b.author || '')).toLowerCase().includes(q)
  );
  $('searchResults').innerHTML = q
    ? results.map(b => `
        <div class="result" onclick="addToCart(${b.id})">
          <b>${b.title}</b> — ${b.genre} — Rp${b.price.toLocaleString('id-ID')}
        </div>`).join('') || '<p>Tidak ditemukan ♡</p>'
    : '';
};

document.querySelectorAll('.genres button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.genres button').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    const g = btn.dataset.genre;
    const filtered = books.filter(b => b.genre.toLowerCase() === g.toLowerCase());
    renderBooks(filtered.length ? filtered : books);
    $('best').scrollIntoView({ behavior: 'smooth' });
    toast(filtered.length ? `Genre ${g}` : `Belum ada koleksi ${g} ♡`);
  };
});

$('language').onchange = e => {
  const en = e.target.value === 'en';
  $('heroText').textContent = en
    ? 'Discover fiction, hidden gems, and stories that feel like home.'
    : 'Temukan novel fiksi, hidden gem, dan cerita yang terasa seperti rumah.';
  $('heroTitle').innerHTML = en
    ? 'Find your world,<br><em>find your story.</em>'
    : 'Cari duniamu,<br><em>temukan ceritamu.</em>';
};

$('checkoutBtn').onclick = checkout;

/* Admin events */
$('adminBtn').onclick = openAdmin;
$('closeAdmin').onclick = closeAdmin;
$('adminLoginBtn').onclick = adminLogin;
$('adminPassword').onkeydown = e => { if (e.key === 'Enter') adminLogin(); };
$('adminLogout').onclick = adminLogout;
$('btnAddBook').onclick = () => openBookForm(null);
$('closeBookForm').onclick = closeBookForm;
$('bookForm').onsubmit = saveBook;
$('btnRefreshOrders').onclick = loadAdminOrders;

document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    $('tabBooks').style.display = name === 'books' ? 'block' : 'none';
    $('tabOrders').style.display = name === 'orders' ? 'block' : 'none';
    if (name === 'orders') loadAdminOrders();
    if (name === 'books') loadAdminBooks();
  };
});

/* ---------- Start ---------- */
loadBooks();

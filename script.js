/* =========================================================
   KlinikPustaka — Dynamic Version (Google Sheets + Apps Script)
   ========================================================= */

const API_URL = 'https://script.google.com/macros/s/AKfycbznet-8rhfk33vsvDisQr3ItlK5YNUjNJFZbOOUBdDqewNeAE92XV5yagR-3KSHJiJHtA/exec'; // 

// Fallback data (jika API gagal / belum di-set)
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

const $ = id => document.getElementById(id);
const slider = $('slider');

/* ---------- Toast ---------- */
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

/* ---------- Load Books from API ---------- */
async function loadBooks() {
  try {
    slider.innerHTML = `<div style="padding:40px;text-align:center;color:#806c73">Memuat koleksi...</div>`;

    const res = await fetch(`${API_URL}?action=books`);
    const json = await res.json();

    if (json.success && Array.isArray(json.books) && json.books.length > 0) {
      books = json.books.map(b => ({
        id: Number(b.id),
        title: b.title || '',
        author: b.author || '',
        genre: b.genre || '',
        price: Number(b.price) || 0,
        stock: Number(b.stock) || 0,
        cover: b.cover || '',
        rating: Number(b.rating) || 4.8,
        status: b.status || 'Available',
        description: b.description || ''
      }));
      console.log('✅ Books loaded from Google Sheets:', books.length);
    } else {
      throw new Error('Data kosong atau format salah');
    }
  } catch (err) {
    console.warn('⚠️ Gagal load dari API, pakai fallback:', err.message);
    books = FALLBACK_BOOKS;
    toast('Mode offline — data lokal');
  }

  renderBooks(books);
  updateCartUI();
}

/* ---------- Render Books ---------- */
function renderBooks(list = books) {
  if (!list.length) {
    slider.innerHTML = `<div style="padding:40px;text-align:center;color:#806c73">Belum ada buku tersedia ♡</div>`;
    return;
  }

  slider.innerHTML = list.map(b => {
    const isSoldOut = b.status === 'Sold Out' || b.stock <= 0;
    const priceFormatted = 'Rp' + b.price.toLocaleString('id-ID');

    return `
      <article class="card" data-id="${b.id}">
        <img class="cover" src="${b.cover}" alt="${b.title}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'">
        <h3>${b.title}</h3>
        <p>${b.genre}${b.author ? ' · ' + b.author : ''} · ⭐ ${b.rating}</p>
        <span class="price"><b>${priceFormatted}</b></span>
        ${isSoldOut
          ? `<button class="buy soldout" disabled>Sold Out</button>`
          : `<button class="buy" onclick="addToCart(${b.id})">Tambah ke Keranjang</button>`
        }
      </article>
    `;
  }).join('');
}

/* ---------- Cart Logic ---------- */
function addToCart(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  if (book.stock <= 0 || book.status === 'Sold Out') {
    toast('Stok habis 😢');
    return;
  }

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({
      id: book.id,
      title: book.title,
      genre: book.genre,
      price: book.price,
      cover: book.cover,
      qty: 1
    });
  }

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
          ${item.genre} · Rp${item.price.toLocaleString('id-ID')}
          <br>
          <button onclick="changeQty(${i}, -1)" style="margin-right:6px">−</button>
          ${item.qty || 1}
          <button onclick="changeQty(${i}, 1)" style="margin-left:6px">+</button>
        </div>
      </div>
      <button onclick="removeFromCart(${i})">×</button>
    </div>
  `).join('');

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
    items: cart.map(i => ({
      id: i.id,
      title: i.title,
      qty: i.qty || 1,
      price: i.price
    })),
    total: total,
    notes: ''
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(orderPayload)
    });
    console.log('Order dikirim ke Google Sheets');
  } catch (err) {
    console.warn('Gagal kirim order ke Sheets:', err);
  }

  const waUrl =
    `https://wa.me/6281234567890?text=` +
    `Halo%20KlinikPustaka%2C%20saya%20ingin%20memesan%3A%0A` +
    `${itemsText}%0A%0A` +
    `Total%3A%20Rp${total.toLocaleString('id-ID')}`;

  window.open(waUrl, '_blank');
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
        </div>
      `).join('') || '<p>Tidak ditemukan. Coba genre atau judul lain ♡</p>'
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

    toast(filtered.length ? `Genre ${g}` : `Belum ada koleksi ${g}, coba yang lain ♡`);
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

/* ---------- Start ---------- */
loadBooks();

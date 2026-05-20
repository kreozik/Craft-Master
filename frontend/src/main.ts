// Picolini — Товары ручной работы
// Полный функционал с корзиной, каталогом, мастерами
import './style.css';

// ============================================
// ТИПЫ ДАННЫХ
// ============================================

type Product = { 
  id: number; 
  name: string; 
  price: number; 
  category: string;
  description?: string;
  seller?: string;
};

type Category = { id: number; name: string; icon: string; count: number; };
type Master = { id: number; name: string; shopName: string; description: string; avatar: string; products: number; rating: number; specialty: string; };
type CartItem = Product & { quantity: number };
type ProductsResponse = { items: Product[] };

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : 'http://api:8000';

// ============================================
// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================

const state = {
  products: [] as Product[],
  cart: [] as CartItem[],
  currentCategory: 'all',
  currentPage: 'catalog' as 'catalog' | 'masters' | 'about' | 'delivery' | 'contacts' | 'cabinet',
  isCartOpen: false,
};


// ============================================
// ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ
// ============================================

const demoProducts: Product[] = [
  // Свечи
  { id: 1, name: 'Свеча "Лесной мох"', price: 850, category: 'Свечи', description: 'Ароматическая свеча с нотами хвои и мха', seller: 'Ирина Рукодельница' },
  { id: 2, name: 'Свеча "Лавандовое поле"', price: 920, category: 'Свечи', description: 'Успокаивающий аромат лаванды', seller: 'Ирина Рукодельница' },
  
  // Керамика
  { id: 3, name: 'Керамическая кружка "Листья"', price: 1450, category: 'Керамика', description: 'Ручная роспись, 350 мл', seller: 'Анна Керамист' },
  { id: 4, name: 'Керамическая ваза "Дуб"', price: 2800, category: 'Керамика', description: 'Высота 25 см, натуральные оттенки', seller: 'Анна Керамист' },
  
  // Вязание
  { id: 5, name: 'Вязаный шарф "Осень"', price: 2200, category: 'Вязание', description: 'Шерсть альпака, длина 180 см', seller: 'Ольга Вязальщица' },
  { id: 6, name: 'Вязаные носки "Тёплые вечера"', price: 980, category: 'Вязание', description: 'Мериносовая шерсть, размер 38-42', seller: 'Ольга Вязальщица' },
  
  // Дерево
  { id: 7, name: 'Деревянная разделочная доска', price: 1900, category: 'Дерево', description: 'Дуб, пропитка пищевым маслом', seller: 'Николай Столяр' },
  { id: 8, name: 'Деревянная шкатулка "Лист"', price: 2400, category: 'Дерево', description: 'Ручная резьба, берёза', seller: 'Николай Столяр' },
  
  // Текстиль
  { id: 9, name: 'Льняная скатерть "Полевые цветы"', price: 3500, category: 'Текстиль', description: '150x250 см, натуральный лён', seller: 'Светлана Текстильщица' },
  { id: 10, name: 'Подушка "Ботаника"', price: 1800, category: 'Текстиль', description: 'Наволочка хлопок, 40x40 см', seller: 'Светлана Текстильщица' },
  
  // Украшения
  { id: 11, name: 'Серьги "Листья папоротника"', price: 1650, category: 'Украшения', description: 'Серебро 925, ручная работа', seller: 'Александра Ювелир' },
  { id: 12, name: 'Браслет "Лесная сказка"', price: 2200, category: 'Украшения', description: 'Натуральные камни, кожаный шнурок', seller: 'Александра Ювелир' },
  
  // Мыло ручной работы
  { id: 13, name: 'Набор мыла "Сад ароматов"', price: 1200, category: 'Мыло', description: '4 кусочка, натуральные масла', seller: 'Мария Мыловар' },
  { id: 14, name: 'Мыло "Мёд и овёс"', price: 380, category: 'Мыло', description: 'Увлажняющее, 100 г', seller: 'Мария Мыловар' },
  
  // Кожаные изделия
  { id: 15, name: 'Кожаный кошелёк "Классика"', price: 3200, category: 'Кожа', description: 'Натуральная кожа, 5 отделений', seller: 'Дмитрий Кожевник' },
  { id: 16, name: 'Кожаный ремень "Премиум"', price: 2800, category: 'Кожа', description: 'Ручная работа, размер M-XL', seller: 'Дмитрий Кожевник' },
];

const demoMasters: Master[] = [
  { id: 1, name: 'Ирина Рукодельница', shopName: 'Мастерская Ирины', description: 'Создаю ароматические свечи из натурального воска уже 5 лет.', avatar: '👩‍🎨', products: 12, rating: 4.9, specialty: 'Свечи ручной работы' },
  { id: 2, name: 'Анна Керамист', shopName: 'Глина и Душа', description: 'Керамика — это моё призвание. Каждое изделие проходит через мои руки с любовью.', avatar: '🎨', products: 8, rating: 4.8, specialty: 'Керамика' },
  { id: 3, name: 'Ольга Вязальщица', shopName: 'Тёплые Нити', description: 'Вяжу с детства. Использую только качественную шерсть.', avatar: '🧶', products: 15, rating: 4.7, specialty: 'Вязаные изделия' },
  { id: 4, name: 'Николай Столяр', shopName: 'Древо Жизни', description: 'Работаю с деревом 20 лет. Каждое изделие уникально.', avatar: '🪵', products: 6, rating: 5.0, specialty: 'Изделия из дерева' },
  { id: 5, name: 'Светлана Текстильщица', shopName: 'Лён и Хлопок', description: 'Шью из натуральных тканей с растительными мотивами.', avatar: '🧵', products: 10, rating: 4.6, specialty: 'Текстиль' },
  { id: 6, name: 'Александра Ювелир', shopName: 'Природные Узоры', description: 'Ювелирные изделия с ботаническими мотивами.', avatar: '💎', products: 20, rating: 4.9, specialty: 'Украшения' },
];

const categories: Category[] = [
  { id: 0, name: 'Все товары', icon: '🌿', count: 16 },
  { id: 1, name: 'Свечи', icon: '🕯️', count: 2 },
  { id: 2, name: 'Керамика', icon: '🏺', count: 2 },
  { id: 3, name: 'Вязание', icon: '🧶', count: 2 },
  { id: 4, name: 'Дерево', icon: '🪵', count: 2 },
  { id: 5, name: 'Текстиль', icon: '🧵', count: 2 },
  { id: 6, name: 'Украшения', icon: '💎', count: 2 },
  { id: 7, name: 'Мыло', icon: '🧼', count: 2 },
  { id: 8, name: 'Кожа', icon: '👜', count: 2 },
];

// ============================================
// УТИЛИТЫ
// ============================================

function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

function getEmojiByCategory(category: string): string {
  const cat = category ? category.toLowerCase() : '';
  if (cat.includes('свеч')) return '🕯️';
  if (cat.includes('керам')) return '🏺';
  if (cat.includes('вяз')) return '🧶';
  if (cat.includes('дерев')) return '🪵';
  if (cat.includes('текстил')) return '🧵';
  if (cat.includes('украш')) return '💎';
  if (cat.includes('мыл')) return '🧼';
  if (cat.includes('кож')) return '👜';
  return '🌿';
}

function saveCart(): void { localStorage.setItem('picolini_cart', JSON.stringify(state.cart)); }
function loadCart(): void { const saved = localStorage.getItem('picolini_cart'); if (saved) state.cart = JSON.parse(saved); }

// ============================================
// API
// ============================================

async function fetchProducts(): Promise<Product[]> {
  try {
    console.log('Fetching products from API...');
    const res = await fetch(`${API_BASE}/api/products`);
    if (res.ok) {
      const data = await res.json();
      console.log('API response:', data);
      if (data.items?.length) {
        console.log('Loaded products from API:', data.items.length);
        return data.items;
      }
    }
    console.log('Using demo products');
    return demoProducts;
  } catch (e) {
    console.error('API error:', e);
    return demoProducts;
  }
}

// ============================================
// КОРЗИНА
// ============================================

function addToCart(product: Product): void {
  console.log('addToCart called with product:', product);
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) existing.quantity++;
  else state.cart.push({ ...product, quantity: 1 });
  saveCart();
  updateCartUI();
  showToast(`${product.name} добавлен в корзину!`);
  console.log('Cart after add:', state.cart);
}

// Делегирование событий для ссылок категорий
function setupCategoryLinks(): void {
  document.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    const categoryLink = target.closest('.category-link');
    if (categoryLink) {
      e.preventDefault();
      const category = categoryLink.getAttribute('data-category');
      if (category) {
        state.currentCategory = category;
        state.currentPage = 'catalog';
        renderPage();
      }
    }
  });
}

// Делегирование событий для кнопок "В корзину"
function setupCartButtons(): void {
  document.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    
    // Логируем все клики для отладки
    console.log('Click detected on:', target.className, target.tagName);
    
    // Клик по кнопке "В корзину" в каталоге
    if (target.classList.contains('btn-buy')) {
      e.stopPropagation();
      e.preventDefault();
      const card = target.closest('.card');
      const productId = card?.getAttribute('data-product-id');
      if (productId) {
        const product = state.products.find(p => String(p.id) === productId);
        if (product) addToCart(product);
      }
    }
    
    // Клик по кнопке "В корзину" в модалке товара
    if (target.classList.contains('btn-add-to-cart')) {
      const modal = target.closest('.product-modal');
      const productId = modal?.getAttribute('data-product-id');
      if (productId) {
        const product = state.products.find(p => String(p.id) === productId);
        if (product) {
          addToCart(product);
          modal?.remove();
        }
      }
    }
    
    // Кнопки в корзине: +/-
    if (target.classList.contains('cart-qty-btn')) {
      console.log('Cart qty button clicked!');
      const productId = target.getAttribute('data-product-id');
      const delta = parseInt(target.getAttribute('data-delta') || '0');
      console.log('productId:', productId, 'delta:', delta);
      if (productId) {
        updateQuantity(productId, delta);
      }
    }
    
    // Кнопка удаления товара из корзины
    if (target.classList.contains('cart-item-remove')) {
      console.log('Remove button clicked!');
      const productId = target.getAttribute('data-product-id');
      console.log('productId:', productId);
      if (productId) {
        removeFromCart(productId);
      }
    }
    
    // Кнопка очистить корзину
    if (target.classList.contains('btn-clear')) {
      console.log('Clear cart clicked!');
      clearCart();
    }
    
    // Кнопка оформить заказ
    if (target.classList.contains('btn-checkout')) {
      console.log('Checkout clicked!');
      checkout();
    }
    
    // Закрытие модалки корзины
    if (target.classList.contains('cart-modal-close')) {
      closeCartModal();
    }
    
    // Закрытие корзины при клике вне контента
    if (target.classList.contains('cart-modal')) {
      closeCartModal();
    }
  });
}

function removeFromCart(productId: number | string): void {
  console.log('removeFromCart called with id:', productId, 'type:', typeof productId);
  state.cart = state.cart.filter(item => String(item.id) !== String(productId));
  saveCart();
  updateCartUI();
  renderCartModal();
}

function updateQuantity(productId: number | string, delta: number): void {
  console.log('updateQuantity called with id:', productId, 'delta:', delta);
  const item = state.cart.find(i => String(i.id) === String(productId));
  console.log('Found item:', item);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(productId);
    else { saveCart(); updateCartUI(); renderCartModal(); }
  }
}

function getCartTotal(): number { return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }
function getCartCount(): number { return state.cart.reduce((sum, item) => sum + item.quantity, 0); }
function updateCartUI(): void { const el = document.querySelector('.cart-count'); if (el) el.textContent = String(getCartCount()); }
function clearCart(): void { state.cart = []; saveCart(); updateCartUI(); renderCartModal(); showToast('Корзина очищена'); }

// ============================================
// TOAST
// ============================================

function showToast(message: string): void {
  const existing = document.querySelector('.toast'); if (existing) existing.remove();
  const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// ============================================
// КОРЗИНА МОДАЛКА
// ============================================

function renderCartModal(): void {
  let modal = document.querySelector('.cart-modal') as HTMLElement;
  if (!modal) { modal = document.createElement('div'); modal.className = 'cart-modal'; document.body.appendChild(modal); }
  const total = getCartTotal(); const count = getCartCount();
  
  console.log('Rendering cart modal, cart items:', state.cart);
  
  modal.innerHTML = `
    <div class="cart-modal-content">
      <div class="cart-modal-header"><h2>🛒 Корзина</h2><button class="cart-modal-close">✕</button></div>
      <div class="cart-modal-body">
        ${state.cart.length === 0 ? `<div class="cart-empty"><div class="cart-empty-icon">🌿</div><p>Корзина пуста</p><span>Добавьте товары из каталога</span></div>` :
          `<div class="cart-items">${state.cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
              <div class="cart-item-icon">${getEmojiByCategory(item.category)}</div>
              <div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">${formatPrice(item.price)}</div></div>
              <div class="cart-item-controls">
                <button class="cart-qty-btn" data-product-id="${item.id}" data-delta="-1">−</button>
                <span>${item.quantity}</span>
                <button class="cart-qty-btn" data-product-id="${item.id}" data-delta="1">+</button>
              </div>
              <button class="cart-item-remove" data-product-id="${item.id}">🗑️</button>
            </div>`).join('')}</div>`}
      </div>
      ${state.cart.length > 0 ? `
        <div class="cart-modal-footer">
          <div class="cart-total"><span>Итого (${count} товаров):</span><strong>${formatPrice(total)}</strong></div>
          <div class="cart-actions"><button class="btn-clear">Очистить</button><button class="btn-checkout">Оформить заказ</button></div>
        </div>` : ''}
    </div>`;
  modal.classList.add('show');
}

function closeCartModal(): void { const modal = document.querySelector('.cart-modal'); if (modal) modal.classList.remove('show'); }
function checkout(): void {
  if (state.cart.length === 0) return;
  const total = getCartTotal(); const count = getCartCount();
  closeCartModal();
  showToast(`🎉 Заказ на ${formatPrice(total)} (${count} товаров) оформлен!`);
  clearCart();
}

// Глобальные функции
declare global { interface Window { closeCartModal: () => void; updateQty: (id: number, delta: number) => void; removeItem: (id: number) => void; clearAllCart: () => void; checkout: () => void; filterByCategory: (cat: string) => void; showProduct: (id: number) => void; addToCartFromList: (id: number) => void; navigateTo: (page: string) => void; filterByMaster: (shop: string) => void; submitContactForm: (e: Event) => void; } }
window.closeCartModal = closeCartModal;
window.updateQty = updateQuantity;
window.removeItem = removeFromCart;
window.clearAllCart = clearCart;
window.checkout = checkout;

// ============================================
// РЕНДЕР СТРАНИЦ
// ============================================

function renderCatalog(): string {
  const filtered = state.currentCategory === 'all' ? state.products : state.products.filter(p => p.category.toLowerCase().includes(state.currentCategory));
  return `
    <div class="wrap">
      <sidebar><h3 class="sidebar-title">Категории</h3><ul class="category-list">
        ${categories.map(cat => `<li class="category-item"><a href="#" class="category-link ${state.currentCategory === (cat.name === 'Все товары' ? 'all' : cat.name.toLowerCase()) ? 'active' : ''}" data-category="${cat.name === 'Все товары' ? 'all' : cat.name.toLowerCase()}"><span>${cat.icon} ${cat.name}</span><span class="category-count">${cat.count}</span></a></li>`).join('')}
      </ul></sidebar>
      <main class="main-content"><h2>Каталог товаров</h2><div class="grid">
        ${filtered.map(p => `<div class="card" data-product-id="${p.id}"><div class="card-image-placeholder">${getEmojiByCategory(p.category)}</div><div class="card-body"><div class="name">${p.name}</div><span class="meta">🌿 ${p.category}</span><div class="card-footer"><div class="price">${formatPrice(p.price)}</div><button class="btn-buy">В корзину</button></div></div></div>`).join('')}
      </div></main>
    </div>`;
}

function renderMasters(): string {
  return `<div class="page-container"><div class="page-header"><h1 class="page-title">🌿 Наши мастера</h1><p class="page-subtitle">Познакомьтесь с талантливыми создателями</p></div>
    <div class="masters-grid">${demoMasters.map(m => `<div class="master-card"><div class="master-avatar">${m.avatar}</div><div class="master-info"><h3 class="master-name">${m.name}</h3><div class="master-shop">${m.shopName}</div><div class="master-specialty">${m.specialty}</div><p class="master-description">${m.description}</p><div class="master-stats"><span>📦 ${m.products} товаров</span><span>⭐ ${m.rating}</span></div><button class="btn-master" onclick="window.filterByMaster('${m.shopName}')">Смотреть работы</button></div></div>`).join('')}</div></div>`;
}

function renderAbout(): string {
  return `<div class="page-container"><div class="page-header"><h1 class="page-title">🌿 О Picolini</h1><p class="page-subtitle">Маркетплейс товаров ручной работы</p></div>
    <div class="about-content"><div class="about-section"><h2>🌱 Наша миссия</h2><p>Мы объединяем талантливых мастеров и ценителей уникальных вещей.</p></div>
    <div class="about-section"><h2>💚 Наши ценности</h2><div class="values-grid">
      <div class="value-card"><div class="value-icon">🌿</div><h3>Экологичность</h3><p>Натуральные материалы</p></div>
      <div class="value-card"><div class="value-icon">✋</div><h3>Ручная работа</h3><p>Уникальные изделия</p></div>
      <div class="value-card"><div class="value-icon">🤝</div><h3>Поддержка мастеров</h3><p>Справедливые условия</p></div>
      <div class="value-card"><div class="value-icon">💝</div><h3>Забота</h3><p>Внимание к каждому</p></div>
    </div></div></div></div>`;
}

function renderDelivery(): string {
  return `<div class="page-container"><div class="page-header"><h1 class="page-title">🚚 Доставка и оплата</h1></div>
    <div class="delivery-content"><div class="delivery-section"><h2>📍 Способы доставки</h2>
      <div class="delivery-options">
        <div class="delivery-option"><div class="delivery-icon">🏠</div><h3>Курьером до двери</h3><p>3-7 дней</p><span class="delivery-price">от 300 ₽</span></div>
        <div class="delivery-option"><div class="delivery-icon">📦</div><h3>Пункт выдачи</h3><p>Заберите в удобном месте</p><span class="delivery-price">от 200 ₽</span></div>
        <div class="delivery-option"><div class="delivery-icon">📮</div><h3>Почта России</h3><p>В любой регион</p><span class="delivery-price">от 250 ₽</span></div>
      </div></div>
    <div class="delivery-section"><h2>💳 Способы оплаты</h2><div class="payment-options"><div class="payment-option"><span>💳 Банковская карта</span></div><div class="payment-option"><span>📱 СБП</span></div><div class="payment-option"><span>💰 При получении</span></div></div></div></div></div>`;
}

function renderContacts(): string {
  return `<div class="page-container"><div class="page-header"><h1 class="page-title">📞 Контакты</h1></div>
    <div class="contacts-content"><div class="contacts-grid">
      <div class="contact-card"><div class="contact-icon">📧</div><h3>Email</h3><a href="mailto:support@picolini.ru">support@picolini.ru</a></div>
      <div class="contact-card"><div class="contact-icon">📱</div><h3>Телефон</h3><a href="tel:+78001234567">+7 (800) 123-45-67</a></div>
      <div class="contact-card"><div class="contact-icon">💬</div><h3>Чат</h3><a href="#" onclick="showToast('Чат откроется скоро!')">Открыть чат</a></div>
      <div class="contact-card"><div class="contact-icon">📍</div><h3>Адрес</h3><span>г. Москва, ул. Природная, 42</span></div>
    </div>
    <div class="contact-form-section"><h2>✉️ Написать нам</h2><form class="contact-form" onsubmit="window.submitContactForm(event)">
      <div class="form-group"><label>Ваше имя</label><input type="text" name="name" placeholder="Как к вам обращаться?" required></div>
      <div class="form-group"><label>Email</label><input type="email" name="email" placeholder="Для ответа" required></div>
      <div class="form-group"><label>Сообщение</label><textarea name="message" rows="4" required></textarea></div>
      <button type="submit" class="btn-submit">Отправить</button>
    </form></div></div></div>`;
}

// ============================================
// НАВИГАЦИЯ И ФИЛЬТРЫ
// ============================================

function navigateTo(page: string): void { state.currentPage = page as any; renderPage(); window.scrollTo(0, 0); }
function filterByCategory(category: string): void { state.currentCategory = category; state.currentPage = 'catalog'; renderPage(); }
function filterByMaster(shopName: string): void { state.currentPage = 'catalog'; state.currentCategory = 'all'; renderPage(); showToast(`Товары мастера "${shopName}"`); }

window.filterByCategory = filterByCategory;
window.filterByMaster = filterByMaster;
window.addToCartFromList = (id: number) => { 
  console.log('addToCartFromList called with id:', id);
  console.log('state.products:', state.products);
  const p = state.products.find(p => p.id === id); 
  console.log('Found product:', p);
  if (p) addToCart(p);
  else console.error('Product not found with id:', id);
};
window.navigateTo = navigateTo;
window.submitContactForm = (e: Event) => { e.preventDefault(); showToast('✅ Сообщение отправлено!'); (e.target as HTMLFormElement).reset(); };

// Экспортируем renderCartModal для вызова из onclick
(window as any).renderCartModal = renderCartModal;

function showProductModal(product: Product): void {
  let modal = document.querySelector('.product-modal') as HTMLElement;
  if (!modal) { modal = document.createElement('div'); modal.className = 'product-modal'; document.body.appendChild(modal); }
  modal.setAttribute('data-product-id', String(product.id));
  modal.innerHTML = `<div class="product-modal-content"><button class="product-modal-close">✕</button>
    <div class="product-modal-body"><div class="product-modal-image">${getEmojiByCategory(product.category)}</div>
    <div class="product-modal-info"><h2>${product.name}</h2><span class="product-meta">🌿 ${product.category}</span>
    <p class="product-description">${product.description || 'Изделие ручной работы'}</p>
    ${product.seller ? `<p class="product-seller">👨‍🎨 Мастер: ${product.seller}</p>` : ''}
    <div class="product-modal-footer"><div class="product-price">${formatPrice(product.price)}</div>
    <button class="btn-add-to-cart">В корзину</button></div></div></div></div>`;
  modal.classList.add('show');
  
  // Закрытие модалки
  modal.querySelector('.product-modal-close')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

window.showProduct = (id: number) => { const p = state.products.find(p => p.id === id); if (p) showProductModal(p); };

function renderPage(): void {
  const main = document.querySelector('.main-content-area');
  if (!main) return;
  if (state.currentPage === 'catalog') main.innerHTML = renderCatalog();
  else if (state.currentPage === 'masters') main.innerHTML = renderMasters();
  else if (state.currentPage === 'about') main.innerHTML = renderAbout();
  else if (state.currentPage === 'delivery') main.innerHTML = renderDelivery();
  else if (state.currentPage === 'contacts') main.innerHTML = renderContacts();
  else if (state.currentPage === 'cabinet') {
    // Кабинет рендерится отдельным файлом
    // Ожидаем контейнер #cabinet-root
    main.innerHTML = '<div id="cabinet-root"></div>';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    import('./cabinet').then((m) => {
      if ('renderCabinet' in m) {
        const root = document.getElementById('cabinet-root');
        if (root) m.renderCabinet(root);
      }
    });
  }
}


// ============================================
// ГЛАВНЫЙ РЕНДЕР
// ============================================

function render(products: Product[]) {
  state.products = products;
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header><div class="header-container">
      <a href="#" class="logo" onclick="window.navigateTo('catalog'); return false;"><div class="logo-icon">🌿</div><div class="logo-text"><span class="logo-title">Picolini</span><span class="logo-subtitle">Товары ручной работы</span></div></a>
      <nav><ul class="nav-menu">
        <li><a href="#" class="nav-link ${state.currentPage === 'catalog' ? 'active' : ''}" onclick="window.navigateTo('catalog'); return false;">Каталог</a></li>
        <li><a href="#" class="nav-link ${state.currentPage === 'masters' ? 'active' : ''}" onclick="window.navigateTo('masters'); return false;">Мастера</a></li>
        <li><a href="#" class="nav-link ${state.currentPage === 'about' ? 'active' : ''}" onclick="window.navigateTo('about'); return false;">О нас</a></li>
        <li><a href="#" class="nav-link ${state.currentPage === 'delivery' ? 'active' : ''}" onclick="window.navigateTo('delivery'); return false;">Доставка</a></li>
        <li><a href="#" class="nav-link ${state.currentPage === 'contacts' ? 'active' : ''}" onclick="window.navigateTo('contacts'); return false;">Контакты</a></li>
      </ul></nav>

      <div class="nav-actions">
        <a href="#" class="nav-cart" onclick="renderCartModal(); return false;">🛒 Корзина<span class="cart-count">${getCartCount()}</span></a>
        <a href="#" class="nav-cart" onclick="window.navigateTo('cabinet'); return false;">👤 Личный кабинет</a>
      </div>
    </div></header>


    <section class="hero"><div class="hero-content">
      <span class="hero-badge">✨ Экологичные материалы</span>
      <h1 class="hero-title">Уникальные вещи<br><span>с душой природы</span></h1>
      <p class="hero-subtitle">Откройте мир изделий ручной работы, созданных с любовью мастерами.</p>
      <div class="hero-buttons"><button class="btn-primary" onclick="window.navigateTo('catalog')">Смотреть каталог</button><button class="btn-secondary" onclick="window.navigateTo('masters')">О мастерах</button></div>
    </div></section>

    <div class="main-content-area">${renderCatalog()}</div>

    <section class="features"><div class="features-container"><h2 class="features-title">Почему выбирают Picolini?</h2>
      <div class="features-grid">
        <div class="feature-card"><div class="feature-icon">🌱</div><h3 class="feature-title">Натуральные материалы</h3><p class="feature-desc">Экологичные материалы</p></div>
        <div class="feature-card"><div class="feature-icon">✋</div><h3 class="feature-title">Ручная работа</h3><p class="feature-desc">Уникальные изделия</p></div>
        <div class="feature-card"><div class="feature-icon">💝</div><h3 class="feature-title">С любовью</h3><p class="feature-desc">С душой в каждом изделии</p></div>
        <div class="feature-card"><div class="feature-icon">🚚</div><h3 class="feature-title">Доставка</h3><p class="feature-desc">По всей России</p></div>
      </div></div></section>

    <footer><div class="footer-container">
      <div class="footer-brand"><div class="footer-logo">🌿 Picolini</div><p class="footer-desc">Маркетплейс товаров ручной работы.</p></div>
      <div><h4 class="footer-title">Покупателям</h4><ul class="footer-links"><li><a href="#" onclick="window.navigateTo('catalog'); return false;">Каталог</a></li><li><a href="#" onclick="window.navigateTo('delivery'); return false;">Доставка</a></li></ul></div>
      <div><h4 class="footer-title">Мастерам</h4><ul class="footer-links"><li><a href="#" onclick="showToast('Регистрация скоро!')">Стать продавцом</a></li></ul></div>
      <div><h4 class="footer-title">Контакты</h4><ul class="footer-links"><li><a href="mailto:support@picolini.ru">📧 support@picolini.ru</a></li><li><a href="tel:+78001234567">📱 +7 (800) 123-45-67</a></li></ul></div>
    </div><div class="footer-bottom">© 2024 Picolini. Сделано с 💚</div></footer>`;
}

async function init() { 
  loadCart(); 
  const products = await fetchProducts(); 
  render(products);
  setupCartButtons();
  setupCategoryLinks();
}
init();

import { clearToken } from './api';
import { navigateTo } from './router';

export function renderLayout(root: HTMLElement, content: string, active: string = '') {
  root.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-logo">🛠 Craft-Master<br><small>Admin</small></div>
        <nav>
          <a href="/admin" data-link class="${active==='dashboard'?'active':''}">📊 Дашборд</a>
          <a href="/admin/users" data-link class="${active==='users'?'active':''}">👥 Пользователи</a>
          <a href="/admin/products" data-link class="${active==='products'?'active':''}">📦 Товары</a>
          <a href="/admin/orders" data-link class="${active==='orders'?'active':''}">📋 Заказы</a>
          <a href="/admin/logs" data-link class="${active==='logs'?'active':''}">📜 Журнал</a>
        </nav>
        <button id="logout-btn" class="logout-btn">🚪 Выход</button>
      </aside>
      <main class="admin-main">${content}</main>
    </div>
  `;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearToken();
    navigateTo('/admin/login');
  });
}

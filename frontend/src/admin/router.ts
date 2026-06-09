import { renderLogin } from './pages/login';
import { renderDashboard } from './pages/dashboard';
import { renderUsers } from './pages/users';
import { renderProducts } from './pages/products';
import { renderOrders } from './pages/orders';
import { renderLogs } from './pages/logs';
import { authApi, clearToken } from './api';

const routes: Record<string, (root: HTMLElement) => void> = {
  '/admin/login': renderLogin,
  '/admin': renderDashboard,
  '/admin/users': renderUsers,
  '/admin/products': renderProducts,
  '/admin/orders': renderOrders,
  '/admin/logs': renderLogs,
};

export async function startAdminRouter(root: HTMLElement) {
  const path = window.location.pathname;

  // Логин — без проверки
  if (path === '/admin/login') {
    renderLogin(root);
    return;
  }

  // Все остальные роуты — проверяем токен и роль
  try {
    await authApi.me();
  } catch {
    clearToken();
    navigateTo('/admin/login');
    return;
  }

  const renderer = routes[path] || renderDashboard;
  renderer(root);
}

export function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  const root = document.getElementById('admin-root');
  if (root) startAdminRouter(root);
}

// Глобальная обработка кликов по data-link
document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('[data-link]');
  if (target) {
    e.preventDefault();
    const href = target.getAttribute('href');
    if (href) navigateTo(href);
  }
});

window.addEventListener('popstate', () => {
  const root = document.getElementById('admin-root');
  if (root) startAdminRouter(root);
});

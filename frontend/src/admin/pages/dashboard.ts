import { statsApi } from '../api';
import { renderLayout } from '../layout';

export async function renderDashboard(root: HTMLElement) {
  renderLayout(root, '<div class="loading">Загрузка...</div>', 'dashboard');

  try {
    const s = await statsApi.get();
    renderLayout(root, `
      <h1>📊 Дашборд</h1>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Пользователи</h3>
          <div class="stat-value">${s.users.total}</div>
          <div class="stat-sub">Покупатели: ${s.users.buyers} • Продавцы: ${s.users.sellers} • Админы: ${s.users.admins}</div>
          <div class="stat-warn">Заблокировано: ${s.users.blocked}</div>
        </div>
        <div class="stat-card">
          <h3>Товары</h3>
          <div class="stat-value">${s.products.total}</div>
          <div class="stat-sub">Активных: ${s.products.active} • На модерации: ${s.products.pending}</div>
          <div class="stat-sub">Отклонённых: ${s.products.rejected} • Отключённых: ${s.products.disabled}</div>
        </div>
        <div class="stat-card">
          <h3>Заказы</h3>
          <div class="stat-value">${s.orders.total}</div>
          <div class="stat-sub">Новых: ${s.orders.created} • Оплачено: ${s.orders.paid}</div>
          <div class="stat-sub">Доставлено: ${s.orders.delivered} • Отменено: ${s.orders.canceled}</div>
        </div>
        <div class="stat-card success">
          <h3>Выручка</h3>
          <div class="stat-value">${s.revenue.toLocaleString('ru-RU')} ₽</div>
          <div class="stat-sub">Сумма по оплаченным/доставленным</div>
        </div>
      </div>
    `, 'dashboard');
  } catch (e: any) {
    renderLayout(root, `<div class="error">Ошибка загрузки: ${e.message}</div>`, 'dashboard');
  }
}

import { ordersApi } from '../api';
import { renderLayout } from '../layout';

let currentPage = 1;
let currentStatus = '';

export async function renderOrders(root: HTMLElement) {
  renderLayout(root, '<div class="loading">Загрузка...</div>', 'orders');
  await loadAndRender(root);
}

async function loadAndRender(root: HTMLElement) {
  try {
    const data = await ordersApi.list({ page: currentPage, status: currentStatus });

    const rows = data.items.map((o: any) => `
      <tr>
        <td>#${o.id}</td>
        <td>${escapeHtml(o.buyer_name || '')}<br><small>${escapeHtml(o.buyer_email || '')}</small></td>
        <td>${o.items_count} шт.</td>
        <td>${Number(o.total_amount).toLocaleString('ru-RU')} ₽</td>
        <td><span class="badge status-${o.status.toLowerCase()}">${o.status}</span></td>
        <td>${new Date(o.created_at).toLocaleString('ru-RU')}</td>
        <td class="actions">
          <select data-act="status" data-id="${o.id}">
            <option value="">Сменить статус...</option>
            <option value="CREATED">CREATED</option>
            <option value="PAID">PAID</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </td>
      </tr>
    `).join('');

    renderLayout(root, `
      <h1>📋 Заказы (${data.total})</h1>
      <div class="toolbar">
        <select id="status-filter">
          <option value="">Все статусы</option>
          <option value="CREATED" ${currentStatus==='CREATED'?'selected':''}>CREATED</option>
          <option value="PAID" ${currentStatus==='PAID'?'selected':''}>PAID</option>
          <option value="SHIPPED" ${currentStatus==='SHIPPED'?'selected':''}>SHIPPED</option>
          <option value="DELIVERED" ${currentStatus==='DELIVERED'?'selected':''}>DELIVERED</option>
          <option value="CANCELED" ${currentStatus==='CANCELED'?'selected':''}>CANCELED</option>
        </select>
        <button id="apply">Применить</button>
      </div>
      <table class="admin-table">
        <thead>
          <tr><th>ID</th><th>Покупатель</th><th>Позиций</th><th>Сумма</th><th>Статус</th><th>Дата</th><th>Действия</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7">Нет данных</td></tr>'}</tbody>
      </table>
      <div class="pagination">
        <button id="prev" ${currentPage<=1?'disabled':''}>← Назад</button>
        <span>Страница ${currentPage}</span>
        <button id="next" ${data.items.length<20?'disabled':''}>Вперёд →</button>
      </div>
    `, 'orders');

    bindEvents(root);
  } catch (e: any) {
    renderLayout(root, `<div class="error">Ошибка: ${e.message}</div>`, 'orders');
  }
}

function bindEvents(root: HTMLElement) {
  document.getElementById('apply')?.addEventListener('click', () => {
    currentStatus = (document.getElementById('status-filter') as HTMLSelectElement).value;
    currentPage = 1;
    loadAndRender(root);
  });

  document.getElementById('prev')?.addEventListener('click', () => { currentPage--; loadAndRender(root); });
  document.getElementById('next')?.addEventListener('click', () => { currentPage++; loadAndRender(root); });

  root.querySelectorAll('select[data-act="status"]').forEach(el => {
    el.addEventListener('change', async (e) => {
      const sel = e.currentTarget as HTMLSelectElement;
      const id = Number(sel.dataset.id);
      const status = sel.value;
      if (!status) return;
      try {
        await ordersApi.changeStatus(id, status);
        await loadAndRender(root);
      } catch (err: any) {
        alert('Ошибка: ' + err.message);
      }
    });
  });
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

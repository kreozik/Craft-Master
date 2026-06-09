import { productsApi } from '../api';
import { renderLayout } from '../layout';

let currentPage = 1;
let currentStatus = '';
let currentSearch = '';

export async function renderProducts(root: HTMLElement) {
  renderLayout(root, '<div class="loading">Загрузка...</div>', 'products');
  await loadAndRender(root);
}

async function loadAndRender(root: HTMLElement) {
  try {
    const data = await productsApi.list({ page: currentPage, status: currentStatus, search: currentSearch });

    const rows = data.items.map((p: any) => `
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.title)}</td>
        <td>${Number(p.price).toLocaleString('ru-RU')} ${p.currency}</td>
        <td>${escapeHtml(p.category || '-')}</td>
        <td>${escapeHtml(p.seller_name || '')}<br><small>${escapeHtml(p.seller_email || '')}</small></td>
        <td><span class="badge status-${p.status.toLowerCase()}">${p.status}</span></td>
        <td>${new Date(p.created_at).toLocaleDateString('ru-RU')}</td>
        <td class="actions">
          <select data-act="status" data-id="${p.id}">
            <option value="">Статус...</option>
            <option value="ACTIVE">✅ Активен</option>
            <option value="PENDING">⏳ На модерации</option>
            <option value="DISABLED">⛔ Отключён</option>
            <option value="REJECTED">❌ Отклонён</option>
          </select>
          <button data-act="delete" data-id="${p.id}" class="danger">🗑</button>
        </td>
      </tr>
    `).join('');

    renderLayout(root, `
      <h1>📦 Товары (${data.total})</h1>
      <div class="toolbar">
        <input id="search" placeholder="Поиск по названию..." value="${escapeHtml(currentSearch)}" />
        <select id="status-filter">
          <option value="">Все статусы</option>
          <option value="ACTIVE" ${currentStatus==='ACTIVE'?'selected':''}>ACTIVE</option>
          <option value="PENDING" ${currentStatus==='PENDING'?'selected':''}>PENDING</option>
          <option value="DISABLED" ${currentStatus==='DISABLED'?'selected':''}>DISABLED</option>
          <option value="REJECTED" ${currentStatus==='REJECTED'?'selected':''}>REJECTED</option>
        </select>
        <button id="apply">Применить</button>
      </div>
      <table class="admin-table">
        <thead>
          <tr><th>ID</th><th>Название</th><th>Цена</th><th>Категория</th><th>Продавец</th><th>Статус</th><th>Создан</th><th>Действия</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8">Нет данных</td></tr>'}</tbody>
      </table>
      <div class="pagination">
        <button id="prev" ${currentPage<=1?'disabled':''}>← Назад</button>
        <span>Страница ${currentPage}</span>
        <button id="next" ${data.items.length<20?'disabled':''}>Вперёд →</button>
      </div>
    `, 'products');

    bindEvents(root);
  } catch (e: any) {
    renderLayout(root, `<div class="error">Ошибка: ${e.message}</div>`, 'products');
  }
}

function bindEvents(root: HTMLElement) {
  document.getElementById('apply')?.addEventListener('click', () => {
    currentSearch = (document.getElementById('search') as HTMLInputElement).value;
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
        await productsApi.changeStatus(id, status);
        await loadAndRender(root);
      } catch (err: any) {
        alert('Ошибка: ' + err.message);
      }
    });
  });

  root.querySelectorAll('button[data-act="delete"]').forEach(el => {
    el.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).dataset.id);
      if (!confirm('Удалить товар безвозвратно?')) return;
      try {
        await productsApi.remove(id);
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

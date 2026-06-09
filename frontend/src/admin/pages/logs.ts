import { logsApi } from '../api';
import { renderLayout } from '../layout';

let currentPage = 1;

export async function renderLogs(root: HTMLElement) {
  renderLayout(root, '<div class="loading">Загрузка...</div>', 'logs');
  await loadAndRender(root);
}

async function loadAndRender(root: HTMLElement) {
  try {
    const data = await logsApi.list(currentPage);

    const rows = data.items.map((l: any) => `
      <tr>
        <td>${l.id}</td>
        <td>${new Date(l.created_at).toLocaleString('ru-RU')}</td>
        <td>${escapeHtml(l.admin_name || '')}<br><small>${escapeHtml(l.admin_email || '')}</small></td>
        <td><span class="badge">${l.action}</span></td>
        <td>${l.entity_type} #${l.entity_id || '-'}</td>
        <td><code>${escapeHtml(JSON.stringify(l.details || {}))}</code></td>
      </tr>
    `).join('');

    renderLayout(root, `
      <h1>📜 Журнал действий (${data.total})</h1>
      <table class="admin-table">
        <thead>
          <tr><th>ID</th><th>Дата</th><th>Админ</th><th>Действие</th><th>Объект</th><th>Детали</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6">Нет данных</td></tr>'}</tbody>
      </table>
      <div class="pagination">
        <button id="prev" ${currentPage<=1?'disabled':''}>← Назад</button>
        <span>Страница ${currentPage}</span>
        <button id="next" ${data.items.length<30?'disabled':''}>Вперёд →</button>
      </div>
    `, 'logs');

    document.getElementById('prev')?.addEventListener('click', () => { currentPage--; loadAndRender(root); });
    document.getElementById('next')?.addEventListener('click', () => { currentPage++; loadAndRender(root); });
  } catch (e: any) {
    renderLayout(root, `<div class="error">Ошибка: ${e.message}</div>`, 'logs');
  }
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

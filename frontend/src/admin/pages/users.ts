import { usersApi } from '../api';
import { renderLayout } from '../layout';

let currentPage = 1;
let currentSearch = '';
let currentRole = '';

export async function renderUsers(root: HTMLElement) {
  renderLayout(root, '<div class="loading">Загрузка...</div>', 'users');
  await loadAndRender(root);
}

async function loadAndRender(root: HTMLElement) {
  try {
    const data = await usersApi.list({ page: currentPage, search: currentSearch, role: currentRole });

    const rows = data.items.map((u: any) => `
      <tr class="${u.is_blocked ? 'row-blocked' : ''}">
        <td>${u.id}</td>
        <td><span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></td>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
        <td>${u.is_blocked ? '🚫 заблок.' : '✅ активен'}</td>
        <td class="actions">
          <button data-act="block" data-id="${u.id}" data-blocked="${u.is_blocked}">${u.is_blocked ? 'Разблок.' : 'Заблок.'}</button>
          <select data-act="role" data-id="${u.id}">
            <option value="">Роль...</option>
            <option value="BUYER">BUYER</option>
            <option value="SELLER">SELLER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button data-act="password" data-id="${u.id}">🔑</button>
          <button data-act="delete" data-id="${u.id}" class="danger">🗑</button>
        </td>
      </tr>
    `).join('');

    renderLayout(root, `
      <h1>👥 Пользователи (${data.total})</h1>
      <div class="toolbar">
        <input id="search" placeholder="Поиск по email/имени..." value="${escapeHtml(currentSearch)}" />
        <select id="role-filter">
          <option value="">Все роли</option>
          <option value="BUYER" ${currentRole==='BUYER'?'selected':''}>BUYER</option>
          <option value="SELLER" ${currentRole==='SELLER'?'selected':''}>SELLER</option>
          <option value="ADMIN" ${currentRole==='ADMIN'?'selected':''}>ADMIN</option>
        </select>
        <button id="apply">Применить</button>
      </div>
      <table class="admin-table">
        <thead>
          <tr><th>ID</th><th>Роль</th><th>Имя</th><th>Email</th><th>Создан</th><th>Статус</th><th>Действия</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="7">Нет данных</td></tr>'}</tbody>
      </table>
      <div class="pagination">
        <button id="prev" ${currentPage<=1?'disabled':''}>← Назад</button>
        <span>Страница ${currentPage}</span>
        <button id="next" ${data.items.length<20?'disabled':''}>Вперёд →</button>
      </div>
    `, 'users');

    bindEvents(root);
  } catch (e: any) {
    renderLayout(root, `<div class="error">Ошибка: ${e.message}</div>`, 'users');
  }
}

function bindEvents(root: HTMLElement) {
  document.getElementById('apply')?.addEventListener('click', () => {
    currentSearch = (document.getElementById('search') as HTMLInputElement).value;
    currentRole = (document.getElementById('role-filter') as HTMLSelectElement).value;
    currentPage = 1;
    loadAndRender(root);
  });

  document.getElementById('prev')?.addEventListener('click', () => { currentPage--; loadAndRender(root); });
  document.getElementById('next')?.addEventListener('click', () => { currentPage++; loadAndRender(root); });

  // Кнопки действий
  root.querySelectorAll('button[data-act]').forEach(el => {
    el.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLElement;
      const act = btn.dataset.act!;
      const id = Number(btn.dataset.id);

      try {
        if (act === 'block') {
          const blocked = btn.dataset.blocked === 'true';
          await usersApi.block(id, !blocked);
        } else if (act === 'password') {
          const pwd = prompt('Новый пароль (мин. 6 символов):');
          if (!pwd) return;
          await usersApi.resetPassword(id, pwd);
          alert('Пароль изменён');
        } else if (act === 'delete') {
          if (!confirm('Удалить пользователя безвозвратно?')) return;
          await usersApi.remove(id);
        }
        await loadAndRender(root);
      } catch (err: any) {
        alert('Ошибка: ' + err.message);
      }
    });
  });

  // Селекты смены роли
  root.querySelectorAll('select[data-act="role"]').forEach(el => {
    el.addEventListener('change', async (e) => {
      const sel = e.currentTarget as HTMLSelectElement;
      const id = Number(sel.dataset.id);
      const role = sel.value;
      if (!role) return;
      try {
        await usersApi.changeRole(id, role);
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

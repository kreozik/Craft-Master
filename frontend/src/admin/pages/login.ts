import { authApi, setToken } from '../api';
import { navigateTo } from '../router';

export function renderLogin(root: HTMLElement) {
  root.innerHTML = `
    <div class="admin-login">
      <form id="login-form" class="admin-login-form">
        <h1>🛠 Craft-Master Admin</h1>
        <input name="email" type="email" placeholder="Email" required value="admin@craftmaster.local" />
        <input name="password" type="password" placeholder="Пароль" required value="Admin123!" />
        <button type="submit">Войти</button>
        <div id="login-error" class="error"></div>
      </form>
    </div>
  `;

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const errBox = document.getElementById('login-error')!;
    errBox.textContent = '';

    try {
      const { token, user } = await authApi.login(
        String(fd.get('email')),
        String(fd.get('password'))
      );
      if (user.role !== 'ADMIN') throw new Error('У вас нет прав администратора');
      setToken(token);
      navigateTo('/admin');
    } catch (err: any) {
      errBox.textContent = err.message;
    }
  });
}

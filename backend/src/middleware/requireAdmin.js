/**
 * Проверка роли ADMIN. Должна идти после authenticate.
 * Загружает актуальные данные из БД (заблокированный админ не пройдёт).
 */
export function requireAdmin(pool) {
  return async (req, res, next) => {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    try {
      const { rows } = await pool.query(
        'SELECT id, role, is_blocked, email, name FROM users WHERE id = $1',
        [req.auth.userId]
      );
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
      if (user.is_blocked) return res.status(403).json({ error: 'Аккаунт заблокирован' });
      if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Требуются права администратора' });
      req.adminUser = user;
      return next();
    } catch (err) {
      console.error('requireAdmin error:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
}

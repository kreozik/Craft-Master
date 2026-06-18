import { Router } from 'express';
import bcrypt from 'bcryptjs';

export function createUsersRouter(pool) {
  const router = Router();

  // Список пользователей
  router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const role = req.query.role || null;

    try {
      const where = [];
      const params = [];

      if (search) { params.push(search); where.push(`(email ILIKE $${params.length} OR name ILIKE $${params.length})`); }
      if (role)   { params.push(role);   where.push(`role = $${params.length}`); }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const countParams = [...params];
      params.push(limit, offset);

      const { rows } = await pool.query(
        `SELECT id, role, name, email, is_blocked, created_at
         FROM users ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM users ${whereSql}`,
        countParams
      );

      return res.json({ items: rows, total: countRows[0].total, page, limit });
    } catch (err) {
      console.error('Users list error:', err);
      return res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
  });

  // Один пользователь
  router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      const { rows } = await pool.query(
        `SELECT id, role, name, email, is_blocked, created_at FROM users WHERE id = $1`,
        [id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Не найден' });
      return res.json(rows[0]);
    } catch (err) {
      console.error('Get user error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Блокировка
  router.patch('/:id/block', async (req, res) => {
    const id = Number(req.params.id);
    const { blocked } = req.body;

    if (id === req.adminUser.id) {
      return res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, role, name, email, is_blocked`,
        [Boolean(blocked), id]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, 'user', $3, $4)`,
        [req.adminUser.id, blocked ? 'BLOCK' : 'UNBLOCK', id, JSON.stringify({ email: rows[0].email })]
      );

      return res.json(rows[0]);
    } catch (err) {
      console.error('Block user error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Смена роли
  router.patch('/:id/role', async (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body;

    if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Недопустимая роль' });
    }

    if (id === req.adminUser.id) {
      return res.status(400).json({ error: 'Нельзя изменять свою роль' });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role, name, email`,
        [role, id]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
         VALUES ($1, 'CHANGE_ROLE', 'user', $2, $3)`,
        [req.adminUser.id, id, JSON.stringify({ newRole: role })]
      );

      return res.json(rows[0]);
    } catch (err) {
      console.error('Role change error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Сброс пароля (админ задаёт новый)
  router.patch('/:id/password', async (req, res) => {
    const id = Number(req.params.id);
    const { password } = req.body;

    if (id === req.adminUser.id) {
      return res.status(400).json({ error: 'Нельзя менять свой пароль через админ-панель' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не короче 6 символов' });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      const { rowCount } = await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [hash, id]
      );

      if (!rowCount) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id)
         VALUES ($1, 'RESET_PASSWORD', 'user', $2)`,
        [req.adminUser.id, id]
      );

      return res.json({ ok: true });
    } catch (err) {
      console.error('Password reset error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Удаление
  router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (id === req.adminUser.id) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }

    try {
      const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      if (!rowCount) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id)
         VALUES ($1, 'DELETE', 'user', $2)`,
        [req.adminUser.id, id]
      );

      return res.json({ ok: true });
    } catch (err) {
      console.error('Delete user error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  return router;
}

import { Router } from 'express';

export function createProductsRouter(pool) {
  const router = Router();

  // Список товаров (все статусы)
  router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const search = req.query.search ? `%${req.query.search}%` : null;

    try {
      const where = [];
      const params = [];

      if (status) { params.push(status); where.push(`p.status = $${params.length}`); }
      if (search) { params.push(search); where.push(`p.title ILIKE $${params.length}`); }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const countParams = [...params];
      params.push(limit, offset);

      const { rows } = await pool.query(
        `SELECT p.id, p.title, p.description, p.price, p.currency, p.status, p.created_at,
                c.name AS category, c.id AS category_id,
                u.email AS seller_email, u.name AS seller_name, u.id AS seller_id
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN users u ON u.id = p.seller_id
         ${whereSql}
         ORDER BY p.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`,
        countParams
      );

      return res.json({ items: rows, total: countRows[0].total, page, limit });
    } catch (err) {
      console.error('Admin products list error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Смена статуса (модерация)
  router.patch('/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!['PENDING','ACTIVE','DISABLED','REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE products SET status = $1 WHERE id = $2 RETURNING id, title, status`,
        [status, id]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
         VALUES ($1, 'CHANGE_STATUS', 'product', $2, $3)`,
        [req.adminUser.id, id, JSON.stringify({ newStatus: status })]
      );

      return res.json(rows[0]);
    } catch (err) {
      console.error('Product status error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Удаление
  router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
      const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
      if (!rowCount) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id)
         VALUES ($1, 'DELETE', 'product', $2)`,
        [req.adminUser.id, id]
      );

      return res.json({ ok: true });
    } catch (err) {
      console.error('Delete product error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  return router;
}

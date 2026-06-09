import { Router } from 'express';

export function createOrdersRouter(pool) {
  const router = Router();

  // Список заказов
  router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    try {
      const params = [];
      let whereSql = '';

      if (status) { params.push(status); whereSql = `WHERE o.status = $1`; }

      const countParams = [...params];
      params.push(limit, offset);

      const { rows } = await pool.query(
        `SELECT o.id, o.status, o.total_amount, o.created_at,
                u.email AS buyer_email, u.name AS buyer_name, u.id AS buyer_id,
                (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS items_count
         FROM orders o
         LEFT JOIN users u ON u.id = o.buyer_id
         ${whereSql}
         ORDER BY o.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM orders o ${whereSql}`,
        countParams
      );

      return res.json({ items: rows, total: countRows[0].total, page, limit });
    } catch (err) {
      console.error('Admin orders list error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Детальный заказ с позициями
  router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
      const { rows: orderRows } = await pool.query(
        `SELECT o.id, o.status, o.total_amount, o.created_at,
                u.id AS buyer_id, u.email AS buyer_email, u.name AS buyer_name
         FROM orders o
         LEFT JOIN users u ON u.id = o.buyer_id
         WHERE o.id = $1`,
        [id]
      );

      if (!orderRows[0]) return res.status(404).json({ error: 'Не найден' });

      const { rows: items } = await pool.query(
        `SELECT oi.id, oi.qty, oi.unit_price,
                p.id AS product_id, p.title
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1`,
        [id]
      );

      const { rows: paymentRows } = await pool.query(
        `SELECT id, provider, payment_status, amount, created_at FROM payments WHERE order_id = $1`,
        [id]
      );

      return res.json({ ...orderRows[0], items, payment: paymentRows[0] || null });
    } catch (err) {
      console.error('Get order error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  // Смена статуса
  router.patch('/:id/status', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!['CREATED','PAID','SHIPPED','DELIVERED','CANCELED'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status, total_amount`,
        [status, id]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Не найден' });

      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, details)
         VALUES ($1, 'CHANGE_STATUS', 'order', $2, $3)`,
        [req.adminUser.id, id, JSON.stringify({ newStatus: status })]
      );

      return res.json(rows[0]);
    } catch (err) {
      console.error('Order status error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  return router;
}

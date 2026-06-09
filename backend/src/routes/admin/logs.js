import { Router } from 'express';

export function createLogsRouter(pool) {
  const router = Router();

  router.get('/', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const offset = (page - 1) * limit;

    try {
      const { rows } = await pool.query(
        `SELECT l.id, l.action, l.entity_type, l.entity_id, l.details, l.created_at,
                u.email AS admin_email, u.name AS admin_name
         FROM admin_logs l
         LEFT JOIN users u ON u.id = l.admin_id
         ORDER BY l.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM admin_logs`
      );

      return res.json({ items: rows, total: countRows[0].total, page, limit });
    } catch (err) {
      console.error('Logs error:', err);
      return res.status(500).json({ error: 'Ошибка' });
    }
  });

  return router;
}

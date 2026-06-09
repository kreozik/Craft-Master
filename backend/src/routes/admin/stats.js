import { Router } from 'express';

export function createStatsRouter(pool) {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const [users, products, orders, revenue] = await Promise.all([
        pool.query(
          `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE role='BUYER')::int AS buyers,
            COUNT(*) FILTER (WHERE role='SELLER')::int AS sellers,
            COUNT(*) FILTER (WHERE role='ADMIN')::int AS admins,
            COUNT(*) FILTER (WHERE is_blocked=true)::int AS blocked
          FROM users`
        ),
        pool.query(
          `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='ACTIVE')::int AS active,
            COUNT(*) FILTER (WHERE status='PENDING')::int AS pending,
            COUNT(*) FILTER (WHERE status='DISABLED')::int AS disabled,
            COUNT(*) FILTER (WHERE status='REJECTED')::int AS rejected
          FROM products`
        ),
        pool.query(
          `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='CREATED')::int AS created,
            COUNT(*) FILTER (WHERE status='PAID')::int AS paid,
            COUNT(*) FILTER (WHERE status='SHIPPED')::int AS shipped,
            COUNT(*) FILTER (WHERE status='DELIVERED')::int AS delivered,
            COUNT(*) FILTER (WHERE status='CANCELED')::int AS canceled
          FROM orders`
        ),
        pool.query(
          `SELECT COALESCE(SUM(total_amount),0)::float AS total
           FROM orders WHERE status IN ('PAID','SHIPPED','DELIVERED')`
        ),
      ]);

      return res.json({
        users: users.rows[0],
        products: products.rows[0],
        orders: orders.rows[0],
        revenue: revenue.rows[0].total,
      });
    } catch (err) {
      console.error('Stats error:', err);
      return res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  });

  return router;
}

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

export function createSellersRouter(pool) {
  const router = Router();

  // Подать заявку на продавца
  router.post('/apply', authenticate, async (req, res) => {
    const { shop_name, description } = req.body;
    const user_id = req.user.id;

    if (!shop_name || !shop_name.trim()) {
      return res.status(400).json({ error: 'Название магазина обязательно' });
    }

    try {
      // Проверим, не подана ли уже заявка
      const existing = await pool.query(
        'SELECT id FROM seller_applications WHERE user_id = $1 AND status = $2',
        [user_id, 'PENDING']
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Заявка уже подана' });
      }

      // Проверим, не является ли уже продавцом
      const isAlreadySeller = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [user_id]
      );

      if (isAlreadySeller.rows[0]?.role === 'SELLER') {
        return res.status(400).json({ error: 'Вы уже являетесь продавцом' });
      }

      // Создаём заявку
      const result = await pool.query(
        'INSERT INTO seller_applications (user_id, shop_name, description) VALUES ($1, $2, $3) RETURNING id',
        [user_id, shop_name.trim(), description?.trim() || '']
      );

      res.status(201).json({
        id: result.rows[0].id,
        message: 'Заявка успешно отправлена. Она будет рассмотрена в течение 24 часов.'
      });
    } catch (error) {
      console.error('Error creating seller application:', error);
      res.status(500).json({ error: 'Ошибка при подаче заявки' });
    }
  });

  // Получить статус заявки текущего пользователя
  router.get('/application-status', authenticate, async (req, res) => {
    const user_id = req.user.id;

    try {
      const result = await pool.query(
        'SELECT id, status, rejection_reason, created_at FROM seller_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user_id]
      );

      if (result.rows.length === 0) {
        return res.json({ status: 'none' });
      }

      const app = result.rows[0];
      res.json({
        status: app.status,
        rejection_reason: app.rejection_reason,
        created_at: app.created_at
      });
    } catch (error) {
      console.error('Error fetching application status:', error);
      res.status(500).json({ error: 'Ошибка при получении статуса' });
    }
  });

  return router;
}

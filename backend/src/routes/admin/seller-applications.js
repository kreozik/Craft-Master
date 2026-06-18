import { Router } from 'express';

export function createSellerApplicationsRouter(pool) {
  const router = Router();

  // Получить все заявки на продавцов (админка)
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          sa.id,
          sa.user_id,
          sa.shop_name,
          sa.description,
          sa.status,
          sa.rejection_reason,
          sa.created_at,
          u.name,
          u.email
        FROM seller_applications sa
        JOIN users u ON sa.user_id = u.id
        ORDER BY sa.created_at DESC
      `);

      res.json({ items: result.rows });
    } catch (error) {
      console.error('Error fetching seller applications:', error);
      res.status(500).json({ error: 'Ошибка при получении заявок' });
    }
  });

  // Одобрить заявку продавца
  router.patch('/:id/approve', async (req, res) => {
    const app_id = req.params.id;
    const admin_id = req.adminUser.id;

    try {
      // Получаем заявку и пользователя
      const appResult = await pool.query(
        'SELECT user_id, shop_name, description FROM seller_applications WHERE id = $1',
        [app_id]
      );

      if (appResult.rows.length === 0) {
        return res.status(404).json({ error: 'Заявка не найдена' });
      }

      const { user_id, shop_name, description } = appResult.rows[0];

      // Начинаем транзакцию
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Обновляем роль пользователя на SELLER
        await client.query(
          'UPDATE users SET role = $1 WHERE id = $2',
          ['SELLER', user_id]
        );

        // Создаём профиль продавца
        await client.query(
          'INSERT INTO seller_profiles (user_id, shop_name, description) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET shop_name = $2, description = $3',
          [user_id, shop_name, description]
        );

        // Обновляем статус заявки
        await client.query(
          'UPDATE seller_applications SET status = $1 WHERE id = $2',
          ['APPROVED', app_id]
        );

        // Логируем действие
        await client.query(
          'INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
          [admin_id, 'APPROVED_SELLER', 'seller_application', app_id]
        );

        await client.query('COMMIT');

        res.json({ message: 'Заявка одобрена' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error approving seller application:', error);
      res.status(500).json({ error: 'Ошибка при одобрении заявки' });
    }
  });

  // Отклонить заявку продавца
  router.patch('/:id/reject', async (req, res) => {
    const app_id = req.params.id;
    const admin_id = req.adminUser.id;
    const { reason } = req.body;

    try {
      await pool.query(
        'UPDATE seller_applications SET status = $1, rejection_reason = $2 WHERE id = $3',
        ['REJECTED', reason || '', app_id]
      );

      // Логируем действие
      await pool.query(
        'INSERT INTO admin_logs (admin_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [admin_id, 'REJECTED_SELLER', 'seller_application', app_id]
      );

      res.json({ message: 'Заявка отклонена' });
    } catch (error) {
      console.error('Error rejecting seller application:', error);
      res.status(500).json({ error: 'Ошибка при отклонении заявки' });
    }
  });

  return router;
}

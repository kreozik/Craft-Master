import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { createStatsRouter } from './stats.js';
import { createUsersRouter } from './users.js';
import { createProductsRouter } from './products.js';
import { createOrdersRouter } from './orders.js';
import { createLogsRouter } from './logs.js';
import { createSellerApplicationsRouter } from './seller-applications.js';

export function createAdminRouter(pool) {
  const router = Router();

  router.use(authenticate);
  router.use(requireAdmin(pool));

  router.get('/me', (req, res) => {
    const { id, role, name, email } = req.adminUser;
    res.json({ id, role, name, email });
  });

  router.use('/stats', createStatsRouter(pool));
  router.use('/users', createUsersRouter(pool));
  router.use('/products', createProductsRouter(pool));
  router.use('/orders', createOrdersRouter(pool));
  router.use('/logs', createLogsRouter(pool));
  router.use('/seller-applications', createSellerApplicationsRouter(pool));

  return router;
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function ensureSchemaAndSeed() {
  if (process.env.SKIP_DB_SCHEMA === 'true') return;

  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);

  if (process.env.SEED_DEMO === 'true') {
    const seedPath = path.join(process.cwd(), 'src', 'db', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seed);
    }
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, db: 'up' });
  } catch {
    return res.status(500).json({ ok: false, db: 'down' });
  }
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (role, name, email, password_hash) 
       VALUES ('BUYER', $1, $2, $3) 
       RETURNING id, role, name, email`,
      [name || 'Пользователь', email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const result = await pool.query(
      'SELECT id, role, name, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Ошибка при входе' });
  }
});

// Получение профиля текущего пользователя
app.get('/api/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, role, name, email FROM users WHERE id = $1',
      [payload.userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    return res.json(user);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/products', async (req, res) => {
  const category = req.query.category;

  const sql = `
    SELECT
      p.id,
      p.title AS name,
      p.price,
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'ACTIVE'
      ${category ? 'AND c.name = $1' : ''}
    ORDER BY p.id;
  `;

  const params = category ? [String(category)] : [];

  try {
    const { rows } = await pool.query(sql, params);
    return res.json({ items: rows });
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    const { rows } = await pool.query(
      `
        SELECT
          p.id,
          p.title AS name,
          p.price,
          c.name AS category
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = $1 AND p.status = 'ACTIVE'
        LIMIT 1;
      `,
      [id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch {
    return res.status(500).json({ error: 'DB error' });
  }
});

app.listen(8000, async () => {
  console.log('Backend API listening on :8000');
  try {
    await ensureSchemaAndSeed();
    console.log('DB schema ensured');
  } catch (e) {
    console.error('DB schema error', e);
  }
});



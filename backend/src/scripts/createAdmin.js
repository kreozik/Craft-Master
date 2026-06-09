import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const EMAIL = process.argv[2] || 'admin@craftmaster.local';
const PASSWORD = process.argv[3] || 'Admin123!';
const NAME = process.argv[4] || 'Administrator';

async function main() {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);
    const result = await pool.query(
      `INSERT INTO users (role, name, email, password_hash)
       VALUES ('ADMIN', $1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN'
       RETURNING id, email, role`,
      [NAME, EMAIL.toLowerCase(), hash]
    );
    console.log('✅ Admin created/updated:', result.rows[0]);
    console.log(`📧 Email:    ${EMAIL}`);
    console.log(`🔑 Password: ${PASSWORD}`);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

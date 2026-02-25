import { Pool } from 'pg';
import { hashSync } from 'bcryptjs';

let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

let initialized = false;

export async function initDb() {
  if (!pool || initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'male_admin', 'female_admin')),
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS iftars (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      iftar_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      mobile_number TEXT UNIQUE NOT NULL,
      qr_token TEXT UNIQUE NOT NULL,
      checked_in INTEGER NOT NULL DEFAULT 0,
      registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      checked_in_at TIMESTAMP WITH TIME ZONE,
      FOREIGN KEY (iftar_id) REFERENCES iftars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS banned_numbers (
      mobile_number TEXT PRIMARY KEY,
      banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Postgres requires explicit drops for altering table constraints cleanly in simple scripts. 
    -- Since this is an MVP in early dev, we attempt to add the constraint if it was missing.
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registrations_mobile_number_key'
      ) THEN
        ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_iftar_id_mobile_number_key;
        ALTER TABLE registrations ADD CONSTRAINT registrations_mobile_number_key UNIQUE (mobile_number);
      END IF;
    END $$;
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as c FROM admins');
  if (parseInt(rows[0].c) === 0) {
    const defaultPassword = hashSync('admin123', 10);
    const query = 'INSERT INTO admins (id, username, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, ['sa-001', 'superadmin', defaultPassword, 'superadmin', 'المشرف العام']);
    await pool.query(query, ['ma-001', 'maleadmin', defaultPassword, 'male_admin', 'مشرف الذكور']);
    await pool.query(query, ['fa-001', 'femaleadmin', defaultPassword, 'female_admin', 'مشرفة الإناث']);
  }

  initialized = true;
}

export default async function getDb() {
  if (!pool) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!initialized) {
    await initDb();
  }
  return pool;
}

import Database from 'better-sqlite3';
import path from 'path';
import { hashSync } from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'ghiras.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    seedAdmins();
  }
  return db;
}

function initTables() {
  db.exec(`
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      iftar_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      qr_token TEXT UNIQUE NOT NULL,
      checked_in INTEGER NOT NULL DEFAULT 0,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      checked_in_at TEXT,
      FOREIGN KEY (iftar_id) REFERENCES iftars(id) ON DELETE CASCADE,
      UNIQUE(iftar_id, mobile_number)
    );
  `);
}

function seedAdmins() {
  const count = db.prepare('SELECT COUNT(*) as c FROM admins').get().c;
  if (count === 0) {
    const insert = db.prepare(
      'INSERT INTO admins (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)'
    );

    const defaultPassword = hashSync('admin123', 10);

    insert.run('sa-001', 'superadmin', defaultPassword, 'superadmin', 'المشرف العام');
    insert.run('ma-001', 'maleadmin', defaultPassword, 'male_admin', 'مشرف الذكور');
    insert.run('fa-001', 'femaleadmin', defaultPassword, 'female_admin', 'مشرفة الإناث');
  }
}

export default getDb;

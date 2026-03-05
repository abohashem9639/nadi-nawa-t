const { Pool } = require('pg');
require('dotenv').config();

async function check() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'deleted_registrations'");
        console.log("Table exists:", res.rows.length > 0);
        if (res.rows.length > 0) {
            const data = await pool.query("SELECT count(*) FROM deleted_registrations");
            console.log("Deleted count:", data.rows[0].count);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
check();

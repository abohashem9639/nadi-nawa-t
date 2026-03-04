import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — SuperAdmin stats
export async function GET() {
    try {
        const db = await getDb();
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const localDate = new Date(utc + (3600000 * 3));
        const effectiveDate = new Date(localDate.getTime() + (4.5 * 3600000)); // Shift boundary to 19:30
        const today = effectiveDate.toISOString().split('T')[0];

        const totalIftarsRes = await db.query('SELECT COUNT(*) as count FROM iftars');
        const totalIftars = parseInt(totalIftarsRes.rows[0].count);

        const totalRegRes = await db.query('SELECT COUNT(*) as count FROM registrations');
        const totalRegistrations = parseInt(totalRegRes.rows[0].count);

        const totalCheckinsRes = await db.query('SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1');
        const totalCheckins = parseInt(totalCheckinsRes.rows[0].count);

        const { rows: todayIftars } = await db.query('SELECT id FROM iftars WHERE date = $1', [today]);
        const todayIftarIds = todayIftars.map(i => i.id);

        let todayRegistrations = 0;
        let todayCheckins = 0;

        if (todayIftarIds.length > 0) {
            const placeholders = todayIftarIds.map((_, i) => `$${i + 1}`).join(',');

            const todayRegRes = await db.query(
                `SELECT COUNT(*) as count FROM registrations WHERE iftar_id IN (${placeholders})`,
                todayIftarIds
            );
            todayRegistrations = parseInt(todayRegRes.rows[0].count);

            const todayCheckinsRes = await db.query(
                `SELECT COUNT(*) as count FROM registrations WHERE iftar_id IN (${placeholders}) AND checked_in = 1`,
                todayIftarIds
            );
            todayCheckins = parseInt(todayCheckinsRes.rows[0].count);
        }

        return NextResponse.json({
            totalIftars,
            totalRegistrations,
            totalCheckins,
            todayRegistrations,
            todayCheckins,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

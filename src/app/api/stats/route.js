import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — SuperAdmin stats
export async function GET() {
    try {
        const db = getDb();
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const totalIftars = db.prepare('SELECT COUNT(*) as count FROM iftars').get().count;

        const totalRegistrations = db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;

        const totalCheckins = db.prepare(
            'SELECT COUNT(*) as count FROM registrations WHERE checked_in = 1'
        ).get().count;

        const todayIftarIds = db.prepare('SELECT id FROM iftars WHERE date = ?').all(today).map(i => i.id);

        let todayRegistrations = 0;
        let todayCheckins = 0;

        if (todayIftarIds.length > 0) {
            const placeholders = todayIftarIds.map(() => '?').join(',');

            todayRegistrations = db.prepare(
                `SELECT COUNT(*) as count FROM registrations WHERE iftar_id IN (${placeholders})`
            ).get(...todayIftarIds).count;

            todayCheckins = db.prepare(
                `SELECT COUNT(*) as count FROM registrations WHERE iftar_id IN (${placeholders}) AND checked_in = 1`
            ).get(...todayIftarIds).count;
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

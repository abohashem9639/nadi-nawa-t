import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const iftarId = params.id;
        if (!iftarId) {
            return NextResponse.json({ error: 'missing_iftar_id' }, { status: 400 });
        }

        const db = await getDb();

        // Fetch Iftar Info
        const { rows: iftarRows } = await db.query('SELECT * FROM iftars WHERE id = $1', [iftarId]);
        const iftar = iftarRows[0];

        if (!iftar) {
            return NextResponse.json({ error: 'iftar_not_found' }, { status: 404 });
        }

        // Fetch Registrations Stats
        const { rows: statsRows } = await db.query(`
            SELECT 
                COUNT(*) as total_registered,
                SUM(CASE WHEN checked_in = 1 THEN 1 ELSE 0 END) as total_checked_in
            FROM registrations 
            WHERE iftar_id = $1
        `, [iftarId]);

        const stats = statsRows[0];

        // Fetch Details for the male/female split since it might be useful later, or just return basic stats
        // We'll also just get all users using the existing API instead of a joined query
        // so we don't need a huge complex response payload.

        return NextResponse.json({
            success: true,
            iftar: {
                ...iftar,
                registered: parseInt(stats.total_registered) || 0,
                checkedIn: parseInt(stats.total_checked_in) || 0,
            }
        });

    } catch (error) {
        console.error('Error fetching detailed iftar stats:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

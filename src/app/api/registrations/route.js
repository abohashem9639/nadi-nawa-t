import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const iftarId = searchParams.get('iftarId');

        if (!iftarId) {
            return NextResponse.json({ error: 'missing_iftar_id' }, { status: 400 });
        }

        const db = await getDb();

        // Fetch registrations for the specific iftar, ordered by registration time
        const { rows } = await db.query(
            `SELECT r.id, r.student_name, r.mobile_number, r.checked_in, r.registered_at, r.checked_in_at, 
             CASE WHEN b.mobile_number IS NOT NULL THEN 1 ELSE 0 END as is_banned 
             FROM registrations r 
             LEFT JOIN banned_numbers b ON r.mobile_number = b.mobile_number 
             WHERE r.iftar_id = $1 ORDER BY r.registered_at ASC`,
            [iftarId]
        );

        return NextResponse.json({ success: true, students: rows });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

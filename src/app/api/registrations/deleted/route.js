import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const iftarId = searchParams.get('iftarId');

        if (!iftarId) {
            return NextResponse.json({ error: 'missing_iftar_id' }, { status: 400 });
        }

        const db = await getDb();
        const { rows } = await db.query(
            'SELECT student_name, mobile_number, registered_at, deleted_at, deleted_by FROM deleted_registrations WHERE iftar_id = $1 ORDER BY deleted_at DESC',
            [iftarId]
        );

        return NextResponse.json({ success: true, deletedStudents: rows });
    } catch (error) {
        console.error('Error fetching deleted students:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const db = await getDb();

        // Archive the registration before deleting
        await db.query(`
            INSERT INTO deleted_registrations (id, iftar_id, student_name, mobile_number, registered_at, deleted_by)
            SELECT id, iftar_id, student_name, mobile_number, registered_at, $2
            FROM registrations WHERE id = $1
        `, [id, session.username]);

        const { rowCount } = await db.query('DELETE FROM registrations WHERE id = $1', [id]);

        if (rowCount === 0) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting student:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

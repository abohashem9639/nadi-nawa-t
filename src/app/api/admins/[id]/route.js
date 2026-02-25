import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

// DELETE — Remove an admin account
export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const adminId = params.id;
        if (!adminId) {
            return NextResponse.json({ error: 'missing_admin_id' }, { status: 400 });
        }

        const db = await getDb();

        const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [adminId]);
        const adminToDelete = rows[0];

        if (!adminToDelete) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        if (adminToDelete.role === 'superadmin') {
            return NextResponse.json({ error: 'cannot_delete_superadmin' }, { status: 403 });
        }

        await db.query('DELETE FROM admins WHERE id = $1', [adminId]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

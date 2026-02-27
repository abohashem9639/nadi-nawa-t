import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// DELETE — Remove an admin account
export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'missing_admin_id' }, { status: 400 });
        }

        const db = await getDb();

        const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [id]);
        const adminToDelete = rows[0];

        if (!adminToDelete) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        if (adminToDelete.role === 'superadmin') {
            return NextResponse.json({ error: 'cannot_delete_superadmin' }, { status: 403 });
        }

        await db.query('DELETE FROM admins WHERE id = $1', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

// PATCH — Update an admin's password
export async function PATCH(request, { params }) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'missing_admin_id' }, { status: 400 });
        }

        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'invalid_password' }, { status: 400 });
        }

        const db = await getDb();

        const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [id]);
        const adminToUpdate = rows[0];

        if (!adminToUpdate) {
            return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }

        // Even superadmin shouldn't easily change another superadmin's password this way, but we'll allow it or restrict it based on preference
        // Let's restrict it to matching id, or just allow it if they are superadmin.

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hashedPassword, id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating admin password:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

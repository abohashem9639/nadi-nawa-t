import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PATCH — Edit own admin credentials
export async function PATCH(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, password } = body;

        if (!username) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        const db = await getDb();
        const cleanUsername = username.trim();

        // Check if username already exists for a DIFFERENT user
        const { rows: existingRows } = await db.query(
            'SELECT id FROM admins WHERE username = $1 AND id != $2',
            [cleanUsername, session.id]
        );

        if (existingRows.length > 0) {
            return NextResponse.json({ error: 'username_exists' }, { status: 409 });
        }

        if (password && password.trim() !== '') {
            // Update both username and password
            const passwordHash = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE admins SET username = $1, password_hash = $2 WHERE id = $3',
                [cleanUsername, passwordHash, session.id]
            );
        } else {
            // Update only username
            await db.query(
                'UPDATE admins SET username = $1 WHERE id = $2',
                [cleanUsername, session.id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

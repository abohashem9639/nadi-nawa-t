import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// GET — List all non-superadmin users
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const { rows } = await db.query(
            "SELECT id, username, name, role FROM admins WHERE role != 'superadmin' ORDER BY name ASC"
        );

        return NextResponse.json({ admins: rows });
    } catch (error) {
        console.error('Error fetching admins:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

// POST — Create a new admin
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'superadmin') {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, password, name, role } = body;

        if (!username || !password || !name || !role) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        if (!['male_admin', 'female_admin'].includes(role)) {
            return NextResponse.json({ error: 'invalid_role' }, { status: 400 });
        }

        const db = await getDb();

        // Check if username already exists
        const { rows: existingRows } = await db.query(
            'SELECT username FROM admins WHERE username = $1',
            [username.trim()]
        );

        if (existingRows.length > 0) {
            return NextResponse.json({ error: 'username_exists' }, { status: 409 });
        }

        const id = uuidv4();
        const passwordHash = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO admins (id, username, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)',
            [id, username.trim(), passwordHash, role, name.trim()]
        );

        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error('Error creating admin:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

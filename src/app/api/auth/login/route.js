import { NextResponse } from 'next/server';
import { login, createSession } from '@/lib/auth';

// POST — Admin login
export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const admin = await login(username, password);

        if (!admin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await createSession(admin);

        return NextResponse.json({
            success: true,
            role: admin.role,
            name: admin.name,
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

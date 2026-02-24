import { compareSync } from 'bcryptjs';
import { cookies } from 'next/headers';
import getDb from './db';

const SESSION_COOKIE = 'ghiras_session';

export async function login(username, password) {
    const db = getDb();
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

    if (!admin) return null;
    if (!compareSync(password, admin.password_hash)) return null;

    return {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        name: admin.name,
    };
}

export async function createSession(admin) {
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
        id: admin.id,
        username: admin.username,
        role: admin.role,
        name: admin.name,
    });

    // Base64 encode the session data
    const encoded = Buffer.from(sessionData).toString('base64');

    cookieStore.set(SESSION_COOKIE, encoded, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);

    if (!cookie) return null;

    try {
        const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

export async function requireRole(...roles) {
    const session = await getSession();
    if (!session) return null;
    if (!roles.includes(session.role)) return null;
    return session;
}

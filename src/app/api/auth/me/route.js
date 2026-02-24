import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET — Get current admin session
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            ...session,
        });
    } catch (error) {
        console.error('Error getting session:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

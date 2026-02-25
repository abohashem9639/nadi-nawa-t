import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || !['superadmin', 'male_admin', 'female_admin'].includes(session.role)) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const { mobileNumber, action } = await request.json();

        if (!mobileNumber || !action) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        const db = await getDb();
        const cleanMobile = mobileNumber.trim();

        if (action === 'ban') {
            await db.query(
                'INSERT INTO banned_numbers (mobile_number) VALUES ($1) ON CONFLICT (mobile_number) DO NOTHING',
                [cleanMobile]
            );
        } else if (action === 'unban') {
            await db.query(
                'DELETE FROM banned_numbers WHERE mobile_number = $1',
                [cleanMobile]
            );
        } else {
            return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in ban/unban route:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

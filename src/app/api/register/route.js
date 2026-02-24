import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// POST — Student registration
export async function POST(request) {
    try {
        const db = await getDb();
        const body = await request.json();
        const { iftarId, studentName, mobileNumber } = body;

        if (!iftarId || !studentName || !mobileNumber) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        // Check iftar exists and is active
        const { rows: iftars } = await db.query(
            'SELECT * FROM iftars WHERE id = $1 AND is_active = 1',
            [iftarId]
        );
        const iftar = iftars[0];

        if (!iftar) {
            return NextResponse.json({ error: 'iftar_not_found' }, { status: 404 });
        }

        // Check if already registered
        const { rows: existings } = await db.query(
            'SELECT * FROM registrations WHERE iftar_id = $1 AND mobile_number = $2',
            [iftarId, mobileNumber]
        );
        const existing = existings[0];

        if (existing) {
            return NextResponse.json({
                error: 'already_registered',
                qrToken: existing.qr_token,
            }, { status: 409 });
        }

        // Check capacity
        const { rows: regCountRows } = await db.query(
            'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = $1',
            [iftarId]
        );
        const regCount = parseInt(regCountRows[0].count);

        if (regCount >= iftar.capacity) {
            return NextResponse.json({ error: 'full' }, { status: 409 });
        }

        // Create registration
        const { v4: uuidv4 } = await import('uuid');
        const id = uuidv4();
        const qrToken = uuidv4();

        await db.query(
            'INSERT INTO registrations (id, iftar_id, student_name, mobile_number, qr_token) VALUES ($1, $2, $3, $4, $5)',
            [id, iftarId, studentName.trim(), mobileNumber.trim(), qrToken]
        );

        return NextResponse.json({
            success: true,
            qrToken,
            studentName: studentName.trim(),
        }, { status: 201 });
    } catch (error) {
        console.error('Error registering:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

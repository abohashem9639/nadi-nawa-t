import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// POST — Student registration
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { iftarId, studentName, mobileNumber } = body;

        if (!iftarId || !studentName || !mobileNumber) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        // Check iftar exists and is active
        const iftar = db.prepare(
            'SELECT * FROM iftars WHERE id = ? AND is_active = 1'
        ).get(iftarId);

        if (!iftar) {
            return NextResponse.json({ error: 'iftar_not_found' }, { status: 404 });
        }

        // Check if already registered
        const existing = db.prepare(
            'SELECT * FROM registrations WHERE iftar_id = ? AND mobile_number = ?'
        ).get(iftarId, mobileNumber);

        if (existing) {
            return NextResponse.json({
                error: 'already_registered',
                qrToken: existing.qr_token,
            }, { status: 409 });
        }

        // Check capacity
        const regCount = db.prepare(
            'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = ?'
        ).get(iftarId).count;

        if (regCount >= iftar.capacity) {
            return NextResponse.json({ error: 'full' }, { status: 409 });
        }

        // Create registration
        const { v4: uuidv4 } = await import('uuid');
        const id = uuidv4();
        const qrToken = uuidv4();

        db.prepare(
            'INSERT INTO registrations (id, iftar_id, student_name, mobile_number, qr_token) VALUES (?, ?, ?, ?, ?)'
        ).run(id, iftarId, studentName.trim(), mobileNumber.trim(), qrToken);

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

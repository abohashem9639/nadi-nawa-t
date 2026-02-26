import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST — Student registration
export async function POST(request) {
    try {
        const db = await getDb();
        const body = await request.json();
        const { iftarId, studentName, isArqam } = body;

        if (!iftarId || !studentName) {
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

        const cleanName = studentName.trim();


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
        const id = uuidv4();
        const qrToken = `GHIRAS_${id}`; // Unique token for QR
        const dummyMobile = uuidv4(); // Unique dummy mobile to satisfy DB UNIQUE constraint without migration
        const arqamFlag = isArqam ? 1 : 0;

        await db.query(`
            INSERT INTO registrations (id, iftar_id, student_name, mobile_number, qr_token, is_arqam)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, iftarId, cleanName, dummyMobile, qrToken, arqamFlag]);

        return NextResponse.json({
            success: true,
            qrToken,
            studentName: cleanName,
        }, { status: 201 });
    } catch (error) {
        console.error('Error registering:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

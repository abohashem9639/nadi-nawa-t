import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// POST — QR Check-in
export async function POST(request) {
    try {
        const db = await getDb();
        const body = await request.json();
        const { qrToken, adminGender } = body;

        if (!qrToken) {
            return NextResponse.json({ error: 'missing_token' }, { status: 400 });
        }

        // Find registration by QR token
        const { rows } = await db.query(
            'SELECT r.*, i.gender, i.title as iftar_title FROM registrations r JOIN iftars i ON r.iftar_id = i.id WHERE r.qr_token = $1',
            [qrToken]
        );
        const registration = rows[0];

        if (!registration) {
            return NextResponse.json({
                status: 'not_found',
                message: 'not_registered',
            }, { status: 200 });
        }

        // Check if correct section (gender match)
        if (adminGender && registration.gender !== adminGender) {
            return NextResponse.json({
                status: 'wrong_section',
                message: 'wrong_section',
                studentName: registration.student_name,
                correctSection: registration.gender,
            }, { status: 200 });
        }

        // Check if already checked in
        if (registration.checked_in) {
            return NextResponse.json({
                status: 'already_checked_in',
                message: 'already_checked_in',
                studentName: registration.student_name,
                checkedInAt: registration.checked_in_at,
            }, { status: 200 });
        }

        // Check in the student
        const now = new Date().toISOString();
        await db.query(
            'UPDATE registrations SET checked_in = 1, checked_in_at = $1 WHERE id = $2',
            [now, registration.id]
        );

        return NextResponse.json({
            status: 'success',
            message: 'check_in_success',
            studentName: registration.student_name,
            iftarTitle: registration.iftar_title,
        }, { status: 200 });
    } catch (error) {
        console.error('Error checking in:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

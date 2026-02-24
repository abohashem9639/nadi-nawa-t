import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — List today's active iftars (public) or filtered by gender
export async function GET(request) {
    try {
        const db = getDb();
        const { searchParams } = new URL(request.url);
        const gender = searchParams.get('gender');
        const allDates = searchParams.get('all') === 'true';

        // Get today's date in YYYY-MM-DD format (local timezone, NOT UTC)
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        let query;
        let params;

        if (allDates) {
            // For SuperAdmin — all iftars
            if (gender) {
                query = 'SELECT * FROM iftars WHERE gender = ? ORDER BY date DESC';
                params = [gender];
            } else {
                query = 'SELECT * FROM iftars ORDER BY date DESC';
                params = [];
            }
        } else {
            // For students — only today's active iftars
            if (gender) {
                query = 'SELECT * FROM iftars WHERE date = ? AND is_active = 1 AND gender = ? ORDER BY created_at DESC';
                params = [today, gender];
            } else {
                query = 'SELECT * FROM iftars WHERE date = ? AND is_active = 1 ORDER BY created_at DESC';
                params = [today];
            }
        }

        const iftars = db.prepare(query).all(...params);

        // Add registration count to each iftar
        const iftarsWithCounts = iftars.map(iftar => {
            const regCount = db.prepare(
                'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = ?'
            ).get(iftar.id).count;

            const checkinCount = db.prepare(
                'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = ? AND checked_in = 1'
            ).get(iftar.id).count;

            return {
                ...iftar,
                registered: regCount,
                checkedIn: checkinCount,
            };
        });

        return NextResponse.json({ iftars: iftarsWithCounts });
    } catch (error) {
        console.error('Error fetching iftars:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST — Create new iftar (SuperAdmin only)
export async function POST(request) {
    try {
        const db = getDb();
        const body = await request.json();
        const { title, date, capacity, gender } = body;

        if (!title || !date || !capacity || !gender) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['male', 'female'].includes(gender)) {
            return NextResponse.json({ error: 'Invalid gender' }, { status: 400 });
        }

        const { v4: uuidv4 } = await import('uuid');
        const id = uuidv4();

        db.prepare(
            'INSERT INTO iftars (id, title, date, capacity, gender, is_active) VALUES (?, ?, ?, ?, ?, 1)'
        ).run(id, title, date, parseInt(capacity), gender);

        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error('Error creating iftar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// GET — List today's active iftars (public) or filtered by gender
export async function GET(request) {
    try {
        const db = await getDb();
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
                query = 'SELECT * FROM iftars WHERE gender = $1 ORDER BY date DESC';
                params = [gender];
            } else {
                query = 'SELECT * FROM iftars ORDER BY date DESC';
                params = [];
            }
        } else {
            // For students — only today's active iftars
            if (gender) {
                query = 'SELECT * FROM iftars WHERE date = $1 AND is_active = 1 AND gender = $2 ORDER BY created_at DESC';
                params = [today, gender];
            } else {
                query = 'SELECT * FROM iftars WHERE date = $1 AND is_active = 1 ORDER BY created_at DESC';
                params = [today];
            }
        }

        const { rows: iftars } = await db.query(query, params);

        // Add registration count to each iftar
        const iftarsWithCounts = await Promise.all(iftars.map(async (iftar) => {
            const { rows: regRows } = await db.query(
                'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = $1',
                [iftar.id]
            );
            const regCount = parseInt(regRows[0].count);

            const { rows: checkinRows } = await db.query(
                'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = $1 AND checked_in = 1',
                [iftar.id]
            );
            const checkinCount = parseInt(checkinRows[0].count);

            return {
                ...iftar,
                registered: regCount,
                checkedIn: checkinCount,
            };
        }));

        return NextResponse.json({ iftars: iftarsWithCounts });
    } catch (error) {
        console.error('Error fetching iftars:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST — Create new iftar (SuperAdmin only)
export async function POST(request) {
    try {
        const db = await getDb();
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

        await db.query(
            'INSERT INTO iftars (id, title, date, capacity, gender, is_active) VALUES ($1, $2, $3, $4, $5, 1)',
            [id, title, date, parseInt(capacity), gender]
        );

        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error('Error creating iftar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

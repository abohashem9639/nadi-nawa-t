import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import crypto from 'crypto';

// GET - Fetch all ratings (for superadmin)
export async function GET() {
    try {
        const db = await getDb();

        // Get all ratings ordered by newest first
        const { rows: ratings } = await db.query(
            'SELECT * FROM ratings ORDER BY created_at DESC'
        );

        // Get summary stats
        const { rows: statsRows } = await db.query(`
            SELECT 
                COUNT(*) as total,
                ROUND(AVG(stars)::numeric, 1) as average,
                COUNT(CASE WHEN stars = 5 THEN 1 END) as five,
                COUNT(CASE WHEN stars = 4 THEN 1 END) as four,
                COUNT(CASE WHEN stars = 3 THEN 1 END) as three,
                COUNT(CASE WHEN stars = 2 THEN 1 END) as two,
                COUNT(CASE WHEN stars = 1 THEN 1 END) as one
            FROM ratings
        `);

        const stats = statsRows[0] || { total: 0, average: 0, five: 0, four: 0, three: 0, two: 0, one: 0 };

        return NextResponse.json({ ratings, stats });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

// POST - Submit a new rating
export async function POST(request) {
    try {
        const { stars, comment } = await request.json();

        // Validate stars
        if (!stars || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
            return NextResponse.json({ error: 'invalid_rating' }, { status: 400 });
        }

        // Sanitize comment (optional, max 500 chars)
        const sanitizedComment = comment ? String(comment).trim().slice(0, 500) : null;

        const db = await getDb();
        const id = crypto.randomUUID();

        await db.query(
            'INSERT INTO ratings (id, stars, comment) VALUES ($1, $2, $3)',
            [id, stars, sanitizedComment]
        );

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Error submitting rating:', error);
        return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
}

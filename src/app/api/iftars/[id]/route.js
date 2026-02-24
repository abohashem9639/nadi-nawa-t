import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// PATCH — Update iftar (toggle active, update details)
export async function PATCH(request, { params }) {
    try {
        const db = await getDb();
        const { id } = await params;
        const body = await request.json();

        const { rows } = await db.query('SELECT * FROM iftars WHERE id = $1', [id]);
        const iftar = rows[0];

        if (!iftar) {
            return NextResponse.json({ error: 'Iftar not found' }, { status: 404 });
        }

        if (body.toggleActive !== undefined) {
            const newActive = iftar.is_active ? 0 : 1;
            await db.query('UPDATE iftars SET is_active = $1 WHERE id = $2', [newActive, id]);
        }

        if (body.title) {
            await db.query('UPDATE iftars SET title = $1 WHERE id = $2', [body.title, id]);
        }

        if (body.capacity) {
            await db.query('UPDATE iftars SET capacity = $1 WHERE id = $2', [parseInt(body.capacity), id]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating iftar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE — Delete iftar
export async function DELETE(request, { params }) {
    try {
        const db = await getDb();
        const { id } = await params;

        await db.query('DELETE FROM iftars WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting iftar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

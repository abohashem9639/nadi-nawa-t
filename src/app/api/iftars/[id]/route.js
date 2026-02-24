import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

// PATCH — Update iftar (toggle active, update details)
export async function PATCH(request, { params }) {
    try {
        const db = getDb();
        const { id } = await params;
        const body = await request.json();

        const iftar = db.prepare('SELECT * FROM iftars WHERE id = ?').get(id);
        if (!iftar) {
            return NextResponse.json({ error: 'Iftar not found' }, { status: 404 });
        }

        if (body.toggleActive !== undefined) {
            const newActive = iftar.is_active ? 0 : 1;
            db.prepare('UPDATE iftars SET is_active = ? WHERE id = ?').run(newActive, id);
        }

        if (body.title) {
            db.prepare('UPDATE iftars SET title = ? WHERE id = ?').run(body.title, id);
        }

        if (body.capacity) {
            db.prepare('UPDATE iftars SET capacity = ? WHERE id = ?').run(parseInt(body.capacity), id);
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
        const db = getDb();
        const { id } = await params;

        db.prepare('DELETE FROM iftars WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting iftar:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

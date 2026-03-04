import getDb from '@/lib/db';
import HomePageClient from './HomePageClient';

// Force this page to always render dynamically on the server (never cached)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // Calculate today's date in UTC+3 (Turkey/Saudi Arabia timezone) and shift the day boundary to 19:30
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localDate = new Date(utc + (3600000 * 3));
  // By adding 4.5 hours, 19:30 becomes 00:00 of the next day format-wise.
  const effectiveDate = new Date(localDate.getTime() + (4.5 * 3600000));
  const today = effectiveDate.toISOString().split('T')[0];

  let iftars = [];

  try {
    const db = await getDb();

    const { rows } = await db.query(
      'SELECT * FROM iftars WHERE date = $1 AND is_active = 1 ORDER BY created_at DESC',
      [today]
    );

    // Add registration counts
    iftars = await Promise.all(rows.map(async (iftar) => {
      const { rows: regRows } = await db.query(
        'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = $1',
        [iftar.id]
      );
      const { rows: checkinRows } = await db.query(
        'SELECT COUNT(*) as count FROM registrations WHERE iftar_id = $1 AND checked_in = 1',
        [iftar.id]
      );

      return {
        id: iftar.id,
        title: iftar.title,
        title_tr: iftar.title_tr,
        title_en: iftar.title_en,
        date: iftar.date,
        capacity: iftar.capacity,
        gender: iftar.gender,
        registered: parseInt(regRows[0].count),
        checkedIn: parseInt(checkinRows[0].count),
      };
    }));
  } catch (error) {
    console.error('Error fetching iftars on server:', error);
  }

  return <HomePageClient iftars={iftars} />;
}

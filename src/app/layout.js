import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export const metadata = {
  title: 'غراس 26 | نادي نواة — Ghiras 26',
  description: 'نظام إدارة إفطارات رمضان — نادي نواة | Ramadan Iftar Management System — Nadi Nawa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

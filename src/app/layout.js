import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export const metadata = {
  title: 'غراس 26 | نادي نواة — Ghiras 26',
  description: 'نظام إدارة إفطارات رمضان — نادي نواة | Ramadan Iftar Management System — Nadi Nawa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            var origFetch = window.fetch;
            window.fetch = function(url, opts) {
              if (typeof url === 'string' && url.indexOf('/api/') !== -1) {
                var sep = url.indexOf('?') !== -1 ? '&' : '?';
                url = url + sep + '_t=' + Date.now();
                opts = opts || {};
                opts.cache = 'no-store';
              }
              return origFetch.call(this, url, opts);
            };
          })();
        `}} />
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

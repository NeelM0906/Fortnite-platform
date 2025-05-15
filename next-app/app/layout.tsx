import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fortnite Analyzer',
  description: 'Analyze Fortnite islands, track player statistics, and get optimal player count predictions',
  applicationName: 'Fortnite Analyzer',
  keywords: ['Fortnite', 'Stats', 'Analytics', 'Player Count', 'Island Analyzer', 'Game Data'],
  viewport: 'width=device-width, initial-scale=1.0',
  authors: [{ name: 'Fortnite Analyzer Team' }],
  creator: 'Fortnite Analyzer',
  icons: {
    icon: '/favicon.ico',
  },
  themeColor: '#4285f4',
  colorScheme: 'light'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}

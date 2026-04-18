import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'BlueRes Jobs',
  description: 'Job postings on the AT Protocol',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

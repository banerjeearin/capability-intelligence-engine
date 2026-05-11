import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Enterprise Transformation Fit Engine',
  description: 'Assess fit for AI enterprise transformation roles.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

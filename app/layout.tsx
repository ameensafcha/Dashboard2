import { Metadata } from 'next';
import RootClientLayout from '@/components/layout/RootClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Safcha Dashboard',
  description: 'Premium Manufacturing & Sales Management System',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  );
}

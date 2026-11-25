import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';

export const metadata: Metadata = {
  title: 'LifeOps — AI-Powered Personal Life Management',
  description:
    'Manage personal reminders, bills, subscriptions, expenses, tasks, and documents with an intelligent assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'V2 REPORT — Create. Generate. Send. | V2 Labs Global',
  description: 'Professional document automation SaaS for V2 Labs Global. Replace manual PDF editing for invoices, bills, and business documents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Arvo:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#3944BC] selection:text-white">
        {children}
      </body>
    </html>
  );
}

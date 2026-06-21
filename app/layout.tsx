import Navbar from '@/app/components/Navbar';
import './globals.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

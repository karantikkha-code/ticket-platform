import Link from 'next/link';
import './globals.css';

export const metadata = { title: 'IT Helpdesk', description: 'Raise and track IT support tickets' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <div className="wrap bar">
            <Link href="/" className="brand"><span className="logo">IT</span> Helpdesk</Link>
            <nav>
              <Link href="/">Raise ticket</Link>
              <Link href="/track">Track ticket</Link>
              <Link href="/admin">IT team</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}

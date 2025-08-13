
import Link from 'next/link';
import '../styles/globals.css';

export const metadata = { title: 'Voice Alchemy Academy', description: 'Live mentorship sessions' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-vaa-navy">
      <body className="min-h-screen text-vaa-cream font-sans">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-vaa-ink/70 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl tracking-wide text-vaa-gold">VAA</Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link className="hover:text-vaa-gold transition" href="/enter-class">Enter Class</Link>
              <Link className="hover:text-vaa-gold transition" href="/admin">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
s
        <footer className="mt-12 border-t border-white/10 text-xs text-white/60">
          <div className="mx-auto max-w-5xl px-4 py-6">© {new Date().getFullYear()} Voice Alchemy Academy</div>
        </footer>
      </body>
    </html>
  )
}

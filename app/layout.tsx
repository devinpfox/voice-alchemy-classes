// app/layout.tsx
import "../styles/globals.css";
import Link from "next/link";

export const metadata = {
  metadataBase: new URL("https://voicealchemyacademy.app"),
  title: {
    default: "Voice Alchemy Academy",
    template: "%s | Voice Alchemy Academy",
  },
  description: "Live mentorship sessions for powerful, confident voice.",
  openGraph: {
    type: "website",
    url: "/",
    title: "Voice Alchemy Academy",
    description: "Live mentorship sessions for powerful, confident voice.",
    siteName: "Voice Alchemy Academy",
    images: [
      {
        url: "/og/vaa-og.png", // make sure this file exists in /public/og/
        width: 1200,
        height: 630,
        alt: "Voice Alchemy Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice Alchemy Academy",
    description: "Live mentorship sessions for powerful, confident voice.",
    images: ["/og/vaa-og.png"],
    // site: "@yourhandle", // optional
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// viewport must be exported separately
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-vaa-navy">
      <body className="min-h-screen text-vaa-cream font-sans">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-vaa-ink/70 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl tracking-wide text-vaa-gold">
              VAA
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link className="hover:text-vaa-gold transition" href="/admin">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <footer className="mt-12 border-t border-white/10 text-xs text-white/60">
          <div className="mx-auto max-w-5xl px-4 py-6">
            © {new Date().getFullYear()} Voice Alchemy Academy
          </div>
        </footer>
      </body>
    </html>
  );
}

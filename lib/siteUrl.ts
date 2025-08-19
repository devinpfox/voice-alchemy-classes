export function getSiteUrl() {
    const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    return process.env.NEXT_PUBLIC_SITE_URL || vercel || "http://localhost:3000"
  }
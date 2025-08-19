// next.config.ts
import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).host : "";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      // ✅ Apply CSP ONLY to your video route (edit this path to match your app)
      {
        source: "/class/:path*", // e.g. if VideoDaily renders on /class/[studentId]
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Daily iframe
              "frame-src https://*.daily.co",
              // Allow API + WebRTC (Daily) + Supabase (just in case that page fetches user)
              `connect-src 'self' https://*.daily.co wss://*.daily.co${
                SUPABASE_HOST ? ` https://${SUPABASE_HOST} wss://${SUPABASE_HOST}` : ""
              } ws://localhost:*`, // allow Next dev HMR
              // Media streams
              "media-src 'self' blob: https://*.daily.co",
              // Images (Daily thumbnails etc.)
              `img-src 'self' data: blob: https://*.daily.co${
                SUPABASE_HOST ? ` https://${SUPABASE_HOST}` : ""
              }`,
              // Dev-friendly script/style (remove 'unsafe-eval' in prod if you can)
              "script-src 'self' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },

      // (optional) If you also render the video component on another route, duplicate the block above with a different `source`.
    ];
  },
};

export default nextConfig;

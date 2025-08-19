"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const email = (new FormData(e.currentTarget).get("email") as string)?.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    // Show the same success state whether or not the email exists (no enumeration)
    if (error) {
      // Log if you want, but keep UI neutral
      setSent(true);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
        <p>
          If an account exists for that address, we’ve sent a password reset link.
          The link will take you back here to set a new password.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Forgot your password?</h1>
      <p className="mb-4">Enter your email and we’ll send you a reset link.</p>
      <form onSubmit={handleReset} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          className="w-full border rounded px-3 py-2"
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded px-4 py-2 border"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}

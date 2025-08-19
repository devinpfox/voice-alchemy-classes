"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // When arriving from the email link, Supabase sets a PASSWORD_RECOVERY session.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // In case the event already happened before we attach the listener:
    supabase.auth.getSession().then(() => setReady(true));

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);

    if (pwd.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setDone(true);
  };

  if (!ready) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Verifying link…</h1>
        <p>If this takes more than a moment, try opening the email link again.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Password updated</h1>
        <p className="mb-4">You can now sign in with your new password.</p>
        <a href="/login" className="underline">Go to login</a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          type="password"
          name="password"
          placeholder="New password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          name="confirm"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded px-4 py-2 border"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

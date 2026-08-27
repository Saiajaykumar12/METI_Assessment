import { useState } from "react";
import { supabase } from "../services/supabase";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loginWithGoogle() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-3xl font-bold text-slate-900">
          METI Assessment
        </h1>

        <p className="mt-3 text-slate-500">
          Sign in to continue
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="mt-8 w-full rounded-lg bg-slate-900 px-4 py-3 text-white"
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
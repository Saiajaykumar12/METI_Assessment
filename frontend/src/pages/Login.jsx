import { useState } from "react";

import { supabase } from "../services/supabase";

export default function Login() {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loginWithGoogle() {
    setLoading(true);
    setError("");

    try {
      const redirectTo =
        import.meta.env.VITE_AUTH_REDIRECT_URL ||
        window.location.origin;

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error(
        "Google login error:",
        err
      );

      setError(
        err?.message ||
          "Unable to sign in with Google. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-900 shadow-2xl">
            M
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
            METI
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Assessment Platform
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">

          <div className="text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
              👋
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Welcome Back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to continue to your personalized
              assessment experience.
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">

              <div className="flex items-start gap-2">
                <span>⚠</span>

                <p>
                  {error}
                </p>
              </div>

            </div>
          )}

          {/* Google Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                <span>
                  Signing in...
                </span>
              </>
            ) : (
              <>
                {/* Google icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.25Z"
                  />

                  <path
                    fill="#34A853"
                    d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M6.54 13.83A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.83V7.64H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.36l3.24-2.53Z"
                  />

                  <path
                    fill="#EA4335"
                    d="M12 6.14c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.21 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.39l3.24 2.53C7.31 7.86 9.46 6.14 12 6.14Z"
                  />
                </svg>

                <span>
                  Continue with Google
                </span>
              </>
            )}

          </button>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">

            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs text-slate-400">
              Secure sign in
            </span>

            <div className="h-px flex-1 bg-slate-200" />

          </div>

          {/* Security information */}
          <div className="rounded-2xl bg-slate-50 p-4">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 text-lg">
                🔒
              </div>

              <div>

                <p className="text-sm font-semibold text-slate-700">
                  Your information is secure
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Authentication is securely handled through
                  Supabase. We never store your Google password.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-slate-500">
          By continuing, you agree to use the METI
          assessment platform responsibly.
        </p>

      </div>

    </main>
  );
}
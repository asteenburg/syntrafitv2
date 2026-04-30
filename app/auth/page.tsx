"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/plan");
      }
    };
    void checkSession();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) {
      setMessage(
        "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setLoading(true);
    setMessage("");

    const method = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error } = await method;

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (isSignUp) {
      setMessage("Account created. Check your email to verify, then log in.");
      setLoading(false);
      return;
    }

    router.push("/plan");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <h1 className="text-2xl font-bold">Welcome to SyntraFit</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {isSignUp
            ? "Create your account to start your personalized setup."
            : "Log in to continue to your workout setup."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-violet-300 focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 outline-none ring-violet-300 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-400 px-4 py-2 font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Please wait..." : isSignUp ? "Create account" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp((prev) => !prev)}
          className="mt-4 text-sm text-violet-300 hover:text-violet-200"
        >
          {isSignUp
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>

        {message ? <p className="mt-4 text-sm text-zinc-300">{message}</p> : null}
      </div>
    </main>
  );
}

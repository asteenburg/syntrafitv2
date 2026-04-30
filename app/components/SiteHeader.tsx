"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SiteHeader() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return;
    }

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(data.session));
      setIsCheckingAuth(false);
    };

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setIsCheckingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsSigningOut(false);
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] text-violet-300"
        >
          SYNTRAFIT
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Home
          </Link>
          <Link
            href="/setup"
            className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Setup
          </Link>
          <Link
            href="/preferences"
            className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Preferences
          </Link>
          <Link
            href="/plan"
            className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
          >
            My Plan
          </Link>
          <Link
            href="/history"
            className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
          >
            History
          </Link>
          {isCheckingAuth ? (
            <span className="rounded-md border border-gray-300 px-3 py-2 text-gray-500">
              ...
            </span>
          ) : isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-md border border-[#E60000]/70 px-3 py-2 font-medium text-[#ffb3b3] transition hover:border-[#E60000] hover:bg-[#E60000]/10 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          ) : (
            <Link
              href="/auth"
              className="rounded-md border border-violet-400/40 px-3 py-2 font-medium text-violet-700 transition hover:border-violet-500/60 hover:bg-violet-100"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

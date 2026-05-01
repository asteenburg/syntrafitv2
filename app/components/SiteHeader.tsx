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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (!supabase) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsSigningOut(false);
    setMobileMenuOpen(false);
    router.push("/auth");
    router.refresh();
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Setup", href: "/setup" },
    { name: "Preferences", href: "/preferences" },
    { name: "My Plan", href: "/plan" },
    { name: "History", href: "/history" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100 bg-[#F9F8FF]/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="z-50 text-sm font-semibold tracking-[0.18em] text-violet-600"
        >
          SYNTRAFIT
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="ml-2 h-4 w-[1px] bg-gray-300" />

          {isCheckingAuth ? (
            <span className="px-3 py-2 text-gray-400">...</span>
          ) : isAuthenticated ? (
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-md border border-red-200 px-3 py-2 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isSigningOut ? "..." : "Sign Out"}
            </button>
          ) : (
            <Link
              href="/auth"
              className="rounded-md bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="z-50 p-2 text-gray-600 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? (
            /* Inline X Icon */
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          ) : (
            /* Inline Menu Icon */
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          )}
        </button>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex flex-col bg-[#F9F8FF] p-6 pt-24 md:hidden">
            <nav className="flex flex-col gap-2 text-lg font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-4 text-gray-800 transition hover:bg-violet-50"
                >
                  {link.name}
                </Link>
              ))}

              <div className="mt-6 border-t border-gray-100 pt-6">
                {isCheckingAuth ? null : isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full rounded-xl bg-red-50 py-4 text-center font-bold text-red-600 transition active:scale-[0.98]"
                  >
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full rounded-xl bg-violet-600 py-4 text-center font-bold text-white transition active:scale-[0.98]"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

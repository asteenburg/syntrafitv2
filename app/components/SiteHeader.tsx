"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Menu, X } from "lucide-react"; // Note: Install lucide-react or use SVG icons

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
          
          <div className="ml-2 h-4 w-[1px] bg-gray-300" /> {/* Divider */}

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
          className="z-50 p-2 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-900" />
          ) : (
            <Menu className="h-6 w-6 text-gray-900" />
          )}
        </button>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex flex-col bg-[#F9F8FF] p-6 pt-24 md:hidden">
            <nav className="flex flex-col gap-4 text-lg font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-gray-100 py-4 text-gray-800"
                >
                  {link.name}
                </Link>
              ))}

              <div className="mt-4 pt-4">
                {isCheckingAuth ? null : isAuthenticated ? (
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full rounded-xl bg-red-50 py-4 text-center font-bold text-red-600"
                  >
                    {isSigningOut ? "Signing Out..." : "Sign Out"}
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full rounded-xl bg-violet-600 py-4 text-center font-bold text-white"
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

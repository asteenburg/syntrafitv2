import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import SiteHeader from "@/app/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SyntraFit",
  description: "Workout tracking, progress, and personalized training setup.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-gray-900">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />

          <div className="flex-1">{children}</div>

          <footer className="border-t border-gray-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between md:px-10">
              <p>© {new Date().getFullYear()} SyntraFit. Built for consistent progress.</p>
              <div className="flex items-center gap-4">
                <Link href="/setup" className="transition hover:text-gray-900">
                  Start Setup
                </Link>
                <Link href="/plan" className="transition hover:text-gray-900">
                  My Plan
                </Link>
                <Link href="/history" className="transition hover:text-gray-900">
                  History
                </Link>
                <Link href="/auth" className="transition hover:text-gray-900">
                  Account
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-start justify-center gap-8 px-6 py-16 md:px-10">
        <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-xs font-semibold tracking-widest text-violet-300">
          SYNTRAFIT
        </span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Train smarter. Track everything. Progress faster.
        </h1>
        <p className="max-w-2xl text-base text-gray-600 md:text-lg">
          SyntraFit helps you log every set, monitor bodyweight and cardio,
          compete with friends, and get a personalized workout setup built for
          your goals.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth"
            className="rounded-xl bg-violet-400 px-6 py-3 text-center font-semibold text-zinc-950 transition hover:bg-violet-300"
          >
            Get Started
          </Link>
          <Link
            href="/auth"
            className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-900 transition hover:border-gray-400"
          >
            Log In
          </Link>
        </div>
      </section>
    </main>
  );
}

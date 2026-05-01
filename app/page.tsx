import Link from "next/link";

export default function Home() {
  return (
    <main className='min-h-screen bg-white text-gray-900'>
      {/* Jumbotron Section */}
      <section className='relative flex min-h-[90vh] w-full items-center px-6 py-20 md:px-12'>
        {/* Subtle Background Accent */}
        <div className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-violet-100 via-transparent to-transparent opacity-50' />

        <div className='mx-auto flex w-full max-w-6xl flex-col items-start text-left'>
          {/* Badge */}
          <span className='mb-6 inline-block rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-600 shadow-sm'>
            SYNTRAFIT
          </span>

          {/* Main Heading */}
          <h1 className='mb-6 max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl'>
            Train smarter. <br />
            <span className='bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'>
              Track everything.
            </span>
          </h1>

          {/* Subtext */}
          <p className='mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl'>
            SyntraFit helps you log every set, monitor bodyweight and cardio,
            compete with friends, and get a personalized workout setup built for
            your goals.
          </p>

          {/* Call to Action Buttons */}
          <div className='flex w-full flex-col gap-4 sm:flex-row'>
            <Link
              href='/auth'
              className='group relative flex items-center justify-center rounded-xl bg-violet-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-violet-700 hover:shadow-violet-200'
            >
              Get Started Free
            </Link>
            <Link
              href='/auth'
              className='flex items-center justify-center rounded-xl border border-gray-200 bg-white px-8 py-4 font-bold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300'
            >
              Sign In
            </Link>
          </div>

          {/* Subtle Social Proof */}
          <div className='mt-10 flex items-center gap-3'></div>
        </div>
      </section>
    </main>
  );
}

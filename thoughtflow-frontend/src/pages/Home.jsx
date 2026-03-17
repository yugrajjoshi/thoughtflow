function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 p-6 md:p-10">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur md:p-10">
        <p className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
          Tailwind is working
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Welcome to ThoughtFlow
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
          This sample screen is styled entirely with Tailwind utility classes. You can now
          compose your auth and feed screens with the same approach.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Utility classes</p>
            <p className="mt-1 text-sm text-slate-600">Spacing, colors, typography and layout</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Responsive ready</p>
            <p className="mt-1 text-sm text-slate-600">Try resizing the window to see breakpoints</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Primary Action
          </button>
          <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Secondary Action
          </button>
        </div>
      </section>
    </main>
  );
}

export default Home;
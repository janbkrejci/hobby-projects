import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <main className="w-full max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start a game or explore the Sudoku demo.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/sudoku"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Sudoku</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Play a generated puzzle with hints, undo, and keyboard support.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Open Sudoku →
            </span>
          </Link>
          <Link
            href="/genetic-sudoku"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Genetic Sudoku</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tune genetic parameters and watch the solver evolve a solution.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Open Genetic Solver →
            </span>
          </Link>
          <Link
            href="/morphic-widgets/index.html"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Morphic Widgets</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore the morphic.js widget demos and utilities.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Open Morphic Widgets →
            </span>
          </Link>
          <Link
            href="/krtkova-mapa"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Krtkova mapa</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Interaktivní mapa památných míst s lokální databází.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Otevřít mapu →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <main className="w-full max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Projekty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Spusť hru nebo prozkoumej ukázky.
        </p>
        <div className="mt-8 grid auto-rows-fr gap-4 sm:grid-cols-2">
          <Link
            href="/sudoku"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Sudoku</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Zahraj si vygenerované sudoku s nápovědami, vracením tahů a
                podporou klávesnice.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Otevřít Sudoku →
            </span>
          </Link>
          <Link
            href="/genetic-sudoku"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Genetic Sudoku</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Uprav parametry a sleduj, jak evoluční solver hledá řešení.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Otevřít genetický solver →
            </span>
          </Link>
          <Link
            href="/morphic-widgets"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Morphic Widgets</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prozkoumej ukázky widgetů a utility z morphic.js.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Otevřít Morphic Widgets →
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
          <Link
            href="/neural-network"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Neural Network</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Playground s perceptronem a jednoduchou dopřednou sítí.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Otevřít playground →
            </span>
          </Link>
          <Link
            href="/flood-scraper"
            className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-semibold">Hladina Výrovky</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Graf historických měření s automatickou aktualizací.
              </p>
            </div>
            <span className="mt-6 text-sm font-medium text-foreground">
              Otevřít graf →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

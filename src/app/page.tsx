import Link from "next/link";

function PurpleGlow({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      style={{ background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)" }}
    />
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line/50 bg-panel p-6 transition-colors hover:border-brass/30 hover:bg-panel-2/50">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brass/10 text-xl">
        {emoji}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-text">{title}</h3>
      <p className="text-caption leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] md:w-[300px]">
      {/* Phone frame */}
      <div className="overflow-hidden rounded-[2.5rem] border-[3px] border-line/40 bg-ink shadow-2xl shadow-brass/5">
        {/* Notch */}
        <div className="relative flex justify-center bg-ink pt-2 pb-1">
          <div className="h-[22px] w-[100px] rounded-full bg-line/30" />
        </div>

        {/* Screen content - fake dashboard */}
        <div className="space-y-3 px-4 pb-6 pt-2">
          {/* Period header */}
          <div className="flex items-center justify-between">
            <span className="text-micro font-semibold text-text">Sierpień 2026</span>
            <span className="text-[10px] text-muted">26 dni do wypłaty</span>
          </div>

          {/* Main card */}
          <div className="rounded-xl bg-panel p-4">
            <p className="mb-0.5 text-[9px] uppercase tracking-wider text-muted">Wolne środki</p>
            <p className="font-display text-[28px] font-bold leading-none tracking-tight text-white">
              1 360,14
              <span className="ml-1 text-[14px] font-medium text-white/40">zł</span>
            </p>
            <p className="mt-2 text-[10px] text-muted">
              ok. <span className="font-mono text-text">52,31 zł</span> dziennie
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-panel-2">
              <div className="h-full w-[65%] rounded-full bg-bad/60" />
            </div>
            {/* Income / Expenses */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/30 pt-3">
              <div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-good" />
                  <span className="text-[9px] text-muted">Przychód</span>
                </div>
                <span className="font-mono text-[11px] font-medium text-text">14 670,00 zł</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-bad" />
                  <span className="text-[9px] text-muted">Wydano</span>
                </div>
                <span className="font-mono text-[11px] font-medium text-text">13 309,86 zł</span>
              </div>
            </div>
          </div>

          {/* Fixed expenses mini */}
          <div>
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
              Zobowiązania stałe
            </p>
            <div className="space-y-0.5 rounded-xl bg-panel">
              {[
                { name: "Leasing", amount: "1 810,00", paid: true },
                { name: "Studia", amount: "990,00", paid: true },
                { name: "Subskrypcje", amount: "139,00", paid: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2 px-3 py-2">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      item.paid ? "border-good/50 bg-good/15" : "border-muted/30 bg-panel-2"
                    }`}
                  >
                    {item.paid && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="#4ADE80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 text-[11px] ${item.paid ? "text-muted line-through" : "text-text"}`}>
                    {item.name}
                  </span>
                  <span className={`font-mono text-[10px] ${item.paid ? "text-muted/40" : "text-text/80"}`}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Envelope tiles */}
          <div>
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted">Koperty</p>
            <div className="flex gap-2">
              {[
                { emoji: "💰", name: "Poduszka", pct: 80, color: "bg-good/10" },
                { emoji: "✈️", name: "Wakacje", pct: 45, color: "bg-brass/10" },
                { emoji: "👕", name: "Ubrania", pct: 20, color: "bg-brass/10" },
              ].map((env) => (
                <div key={env.name} className="relative flex-1 overflow-hidden rounded-lg bg-panel" style={{ height: 56 }}>
                  <div className={`absolute inset-x-0 bottom-0 ${env.color}`} style={{ height: `${env.pct}%` }}>
                    <div className="absolute inset-x-0 top-0 h-px bg-good/30" />
                  </div>
                  <div className="relative z-10 flex h-full flex-col justify-between p-2">
                    <span className="text-[12px]">{env.emoji}</span>
                    <span className="text-[8px] text-muted">{env.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-around border-t border-line/30 bg-panel px-2 py-2">
          {["Pulpit", "Wydatki"].map((label) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div className={`h-2 w-2 rounded-full ${label === "Pulpit" ? "bg-brass" : "bg-muted/30"}`} />
              <span className={`text-[8px] ${label === "Pulpit" ? "text-brass" : "text-muted"}`}>{label}</span>
            </div>
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brass">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M3 7H11" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {["Koperty", "Statystyki"].map((label) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div className="h-2 w-2 rounded-full bg-muted/30" />
              <span className="text-[8px] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-ui text-text">
      {/* Ambient glows */}
      <PurpleGlow className="-top-40 -right-40 h-[500px] w-[500px]" />
      <PurpleGlow className="top-[60%] -left-60 h-[400px] w-[400px]" />
      <PurpleGlow className="bottom-0 right-[20%] h-[300px] w-[300px] opacity-50" />

      {/* ─── Nav ─── */}
      <nav className="safe-top relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 md:px-10 md:pt-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/15">
            <span className="font-display text-lg font-bold text-brass">B</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Budżet</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-caption font-medium text-muted transition-colors hover:text-text sm:block"
          >
            Zaloguj się
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-micro font-medium text-muted transition-colors hover:text-text sm:hidden"
          >
            Logowanie
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brass px-4 py-2 text-micro font-semibold text-white transition-opacity hover:opacity-90 md:px-5 md:py-2.5 md:text-caption"
          >
            Załóż konto
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-16 pb-10 md:px-10 md:pt-24 md:pb-16">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-8">
          {/* Left - copy */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line/50 bg-panel px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
              <span className="text-micro font-medium text-muted">Darmowa aplikacja PWA</span>
            </div>

            <h1 className="mb-5 font-display text-[2.75rem] font-bold leading-[1.08] tracking-tight text-white md:text-[3.5rem]">
              Kontroluj swoje{" "}
              <span className="text-brass">pieniądze</span>,
              <br />
              nie na odwrót.
            </h1>

            <p className="mb-8 max-w-md text-body-lg leading-relaxed text-muted">
              Budżet kopertowy w Twojej kieszeni. Wiesz ile masz, ile możesz
              wydać dziennie i gdzie uciekają pieniądze - zanim będzie za późno.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brass px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brass/20 transition-all hover:opacity-90 hover:shadow-brass/30"
              >
                Zacznij za darmo
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-line px-6 py-3.5 text-sm font-medium text-muted transition-colors hover:border-brass/30 hover:text-text"
              >
                Mam już konto
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap gap-6 text-micro text-muted">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L8.8 4.6L13 5.2L10 8L10.6 13L7 11L3.4 13L4 8L1 5.2L5.2 4.6L7 1Z" fill="#FBBF24" />
                </svg>
                100% darmowe
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="4" width="10" height="8" rx="1.5" stroke="#7C5CFC" strokeWidth="1.2" />
                  <path d="M5 4V3C5 1.9 5.9 1 7 1C8.1 1 9 1.9 9 3V4" stroke="#7C5CFC" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Szyfrowanie E2E
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="9" rx="2" stroke="#8585A0" strokeWidth="1.2" />
                  <path d="M1 6H13" stroke="#8585A0" strokeWidth="1.2" />
                </svg>
                Działa offline
              </div>
            </div>
          </div>

          {/* Right - phone mockup */}
          <div className="relative flex justify-center">
            <div className="absolute top-[10%] left-[10%] h-[200px] w-[200px] rounded-full bg-brass/10 blur-[80px]" />
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            Wszystko, czego potrzebujesz
          </h2>
          <p className="mx-auto max-w-lg text-body text-muted">
            Cztery pytania, na które odpowiesz w&nbsp;sekundę po otwarciu aplikacji.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            emoji="💰"
            title="Ile mam do wypłaty?"
            description="Główny wskaźnik pokazuje wolne środki i dzienny limit wydatków. Jeden rzut oka wystarczy."
          />
          <FeatureCard
            emoji="📊"
            title="Gdzie uciekają pieniądze?"
            description="15 kategorii z auto-detekcją. Filtry, statystyki, trendy między okresami."
          />
          <FeatureCard
            emoji="💎"
            title="Ile mam odłożone?"
            description="System kopert z wizualnym poziomem napełnienia. Wakacje, poduszka, ubrania - wszystko pod kontrolą."
          />
          <FeatureCard
            emoji="⚡"
            title="Ile wydałem impulsywnie?"
            description="Oznaczaj impulsy jednym tapnięciem. Licznik straszy, ale motywuje do zmian."
          />
        </div>

        {/* E2E encryption highlight */}
        <div className="mt-6 rounded-2xl border border-brass/20 bg-brass/5 p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brass/15">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="11" rx="2" stroke="#7C5CFC" strokeWidth="1.5" />
                <path d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10" stroke="#7C5CFC" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#7C5CFC" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-text">
                Szyfrowanie end-to-end (AES-256-GCM)
              </h3>
              <p className="text-caption leading-relaxed text-muted">
                Twoje kwoty, nazwy transakcji i koperty są szyfrowane kluczem
                wyprowadzonym z hasła. Nawet administrator bazy danych nie
                odczyta Twoich finansów.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 md:px-10">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            Jak to działa?
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Wpisz wypłatę",
              desc: "Otwórz nowy okres budżetowy kiedy dostaniesz pieniądze. Aplikacja sama policzy resztę.",
            },
            {
              step: "02",
              title: "Wpisuj wydatki na bieżąco",
              desc: "W sklepie, na stacji, w kawiarni - 5 sekund jedną ręką. Kategoria wykrywana automatycznie.",
            },
            {
              step: "03",
              title: "Resztę rozdysponuj",
              desc: "Przed kolejną wypłatą prześlij to co zostało na koperty oszczędnościowe. Powtarzaj.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-line/50 bg-panel p-6">
              <span className="mb-3 block font-mono text-xl font-bold text-brass">{item.step}</span>
              <h3 className="mb-2 text-sm font-semibold text-text">{item.title}</h3>
              <p className="text-caption leading-relaxed text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
        <div className="overflow-hidden rounded-3xl border border-line/50 bg-panel p-8 text-center md:p-14">
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-20 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-brass/8 blur-[100px]" />
          </div>
          <div className="relative">
            <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
              Zacznij kontrolować swój budżet
            </h2>
            <p className="mx-auto mb-8 max-w-md text-body text-muted">
              Bez karty kredytowej. Bez subskrypcji. Bez ukrytych kosztów.
              <br />
              Tylko Ty i Twoje pieniądze.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-brass px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brass/20 transition-all hover:opacity-90"
            >
              Stwórz darmowe konto
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 mx-auto max-w-6xl px-5 py-8 md:px-10">
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line/30 pt-6 text-micro text-muted md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-text">Budżet</span>
            <span>· Osobisty budżet kopertowy</span>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Nieprawidłowy e-mail lub hasło.");
      } else if (code === "auth/too-many-requests") {
        setError("Za dużo prób. Spróbuj ponownie za chwilę.");
      } else {
        setError("Nie udało się zalogować. Spróbuj ponownie.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-3xl font-semibold text-text">
          Budżet
        </h1>
        <p className="mb-8 text-sm text-muted">Zaloguj się, aby kontynuować</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-muted">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-text placeholder:text-muted/50 focus:border-brass focus:outline-none"
              placeholder="imie.nazwisko@poczta.pl"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-muted">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-text placeholder:text-muted/50 focus:border-brass focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-bad">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brass py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <Link
            href="/reset-password"
            className="block text-muted hover:text-text"
          >
            Nie pamiętam hasła
          </Link>
          <Link
            href="/register"
            className="block text-muted hover:text-text"
          >
            Nie mam konta — <span className="text-brass">zarejestruj się</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

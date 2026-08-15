"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/firebase/auth";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("Nie udało się wysłać wiadomości. Sprawdź adres e-mail.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="mb-2 text-lg font-medium text-text">Gotowe</p>
          <p className="mb-6 text-sm text-muted">
            Wysłaliśmy link do resetowania hasła na {email}. Sprawdź skrzynkę.
          </p>
          <Link
            href="/login"
            className="text-sm text-brass hover:underline"
          >
            Wróć do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 font-display text-3xl font-semibold text-text">
          Resetuj hasło
        </h1>
        <p className="mb-8 text-sm text-muted">
          Podaj e-mail, na który wyślemy link do zmiany hasła
        </p>

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
            />
          </div>

          {error && <p className="text-sm text-bad">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brass py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Wysyłanie…" : "Wyślij link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted hover:text-text">
            Wróć do logowania
          </Link>
        </div>
      </div>
    </div>
  );
}

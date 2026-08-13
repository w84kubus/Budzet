import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budżet",
  description: "Aplikacja do zarządzania budżetem osobistym",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="bg-ink text-text font-ui antialiased">
        {children}
      </body>
    </html>
  );
}

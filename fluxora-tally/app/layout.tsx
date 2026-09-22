import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./analytics.css";

export const metadata: Metadata = {
  title: "Fluxora Tally",
  description: "A private Fluxora commission analytics dashboard.",
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

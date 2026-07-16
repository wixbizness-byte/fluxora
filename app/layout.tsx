import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fluxora — Create. Ideate. Generate.",
  description: "Curated AI tools, practical workflows, and ready-to-use GPTs designed to move ideas into action.",
};

const themeScript = `(function(){try{var saved=localStorage.getItem('fluxora-theme');document.documentElement.dataset.theme=saved==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}

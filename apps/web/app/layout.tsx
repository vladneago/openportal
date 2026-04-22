import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "OpenPortal",
    template: "%s | OpenPortal",
  },
  description: "The Open Source Enterprise Collaboration Platform",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="min-h-screen bg-surface font-sans">
        {children}
      </body>
    </html>
  );
}

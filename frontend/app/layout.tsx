import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Connect 4 AI Studio — Minimax, Alpha-Beta & Expectimax",
  description: "University AI Assignment: Connect 4 with Minimax, Alpha-Beta Pruning, Expectimax, Iterative Deepening, and Search Tree Visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400 bg-slate-950">
          Connect 4 AI Engine • Artificial Intelligence University Assignment • Minimax, Alpha-Beta Pruning & Expectimax
        </footer>
      </body>
    </html>
  );
}

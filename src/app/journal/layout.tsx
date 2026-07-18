import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trade Journal — MacroMind FX",
  description: "AI-powered forex trade journal. Log your trades and get instant AI review with grades and suggestions.",
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}

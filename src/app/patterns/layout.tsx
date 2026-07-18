import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pattern Detection — MacroMind FX",
  description: "AI-enhanced chart pattern detection: double tops, head and shoulders, support/resistance, and trend analysis.",
};

export default function PatternsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

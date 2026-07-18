import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News AI — MacroMind FX",
  description: "AI-powered forex news impact analyzer. Paste any headline or tweet for instant market sentiment analysis.",
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

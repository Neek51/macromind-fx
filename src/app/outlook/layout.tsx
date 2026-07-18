import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Outlook — MacroMind FX",
  description: "AI-generated daily market outlook with key levels, events to watch, and trading opportunities.",
};

export default function OutlookLayout({ children }: { children: React.ReactNode }) {
  return children;
}

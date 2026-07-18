import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Economic Calendar — MacroMind FX",
  description: "Forex economic calendar with live events from ForexFactory. Filter by impact level.",
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Price Alerts — MacroMind FX",
  description: "Set smart price alerts and get browser notifications when your target prices are hit.",
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

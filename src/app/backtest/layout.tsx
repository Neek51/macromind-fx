import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backtest — MacroMind FX",
  description: "Test trading strategies against historical data with full performance analytics.",
};

export default function BacktestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

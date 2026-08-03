import { NextResponse } from "next/server";
import { readDb, writeDb } from "../../lib/db";

export async function GET() {
  try {
    const data = readDb();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/trades error:", error);
    return NextResponse.json({ success: false, error: "Failed to read database" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = readDb();

    switch (action) {
      case "create-trade": {
        const { trade } = body;
        if (!trade) {
          return NextResponse.json({ success: false, error: "Missing trade data" }, { status: 400 });
        }
        data.trades.push(trade);
        writeDb(data);
        break;
      }

      case "close-trade": {
        const { tradeId, exitPrice, pnlPercentage, pnlAmount, closedAt, postmortem, lesson } = body;
        if (!tradeId || exitPrice == null) {
          return NextResponse.json({ success: false, error: "Missing close details" }, { status: 400 });
        }
        const trade = data.trades.find((t) => t.id === tradeId);
        if (trade) {
          trade.status = "closed";
          trade.exitPrice = exitPrice;
          trade.pnlPercentage = pnlPercentage;
          trade.pnlAmount = pnlAmount;
          trade.closedAt = closedAt || new Date().toISOString();
          trade.postmortem = postmortem || null;
          trade.lesson = lesson || null;
          
          // Adjust account balance based on PnL
          data.balance = Number((data.balance + pnlAmount).toFixed(2));
          writeDb(data);
        }
        break;
      }

      case "update-balance": {
        const { balance } = body;
        if (balance == null || isNaN(Number(balance))) {
          return NextResponse.json({ success: false, error: "Invalid balance value" }, { status: 400 });
        }
        data.balance = Number(balance);
        writeDb(data);
        break;
      }

      case "update-autopilot": {
        const { autoPilot } = body;
        if (autoPilot == null) {
          return NextResponse.json({ success: false, error: "Missing autoPilot value" }, { status: 400 });
        }
        data.autoPilot = Boolean(autoPilot);
        writeDb(data);
        break;
      }

      case "update-last-executed": {
        const { computedAt } = body;
        data.lastExecutedPrediction = computedAt || "";
        writeDb(data);
        break;
      }

      case "reset": {
        const { balance } = body;
        data.trades = [];
        data.balance = balance != null ? Number(balance) : 10000;
        data.autoPilot = false;
        data.lastExecutedPrediction = "";
        writeDb(data);
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json({ success: false, error: "Failed to update database" }, { status: 500 });
  }
}

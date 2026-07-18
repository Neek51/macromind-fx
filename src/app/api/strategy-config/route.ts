import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "strategy-config.json");

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({
        botToken: "",
        chatId: "",
        alerts: []
      });
    }
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read config file" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const config = await req.json();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return NextResponse.json({ success: true, message: "Configuration saved to disk." });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save config file" }, { status: 500 });
  }
}

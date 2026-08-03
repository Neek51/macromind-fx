import fs from "fs";
import path from "path";
import type { VirtualTrade } from "../types";

const DB_PATH = path.join(process.cwd(), "data", "trades-db.json");

export type DbSchema = {
  trades: VirtualTrade[];
  balance: number;
  autoPilot: boolean;
  lastExecutedPrediction: string;
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DbSchema = {
      trades: [],
      balance: 10000,
      autoPilot: false,
      lastExecutedPrediction: "",
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
  }
}

export function readDb(): DbSchema {
  ensureDb();
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content) as DbSchema;
  } catch {
    return {
      trades: [],
      balance: 10000,
      autoPilot: false,
      lastExecutedPrediction: "",
    };
  }
}

export function writeDb(data: DbSchema) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

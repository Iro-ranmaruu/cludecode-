import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");

declare global {
  var __sqliteDb: Database.Database | undefined;
}

const db = global.__sqliteDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") {
  global.__sqliteDb = db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    application_date TEXT,
    branch_name TEXT,
    branch_code TEXT,
    supervisor_name TEXT,
    staff_name TEXT,
    employee_number TEXT,
    customer_facility_name TEXT,
    delivery_department TEXT,
    customer_codes TEXT,
    competitor_maker_name TEXT,
    competitor_product_name TEXT,
    competitor_product_code TEXT,
    competitor_jan_code TEXT,
    competitor_purchase_price TEXT,
    competitor_delivery_price TEXT,
    competitor_vendor TEXT,
    reason_type TEXT,
    special_notes TEXT,
    planning_remarks TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
  );

  CREATE TABLE IF NOT EXISTS request_items (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    product_name TEXT,
    maker_code TEXT,
    product_code TEXT,
    delivery_price REAL,
    standard_wholesale_price REAL,
    desired_wholesale_price REAL,
    monthly_avg_sales TEXT,
    existing_special_price_flag INTEGER NOT NULL DEFAULT 0,
    delivery_start_date TEXT,
    register_special_price TEXT,
    end_date TEXT,
    product_abbreviation TEXT,
    decision TEXT NOT NULL DEFAULT '未決定',
    decided_wholesale_price REAL
  );

  CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
`);

export default db;

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { parseCsvText } from "@/lib/csv";

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
db.pragma("busy_timeout = 15000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    employee_number TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    name TEXT NOT NULL,
    branch_name TEXT,
    role TEXT NOT NULL DEFAULT '営業',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_master (
    maker_code TEXT NOT NULL,
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    packing_unit TEXT,
    standard_wholesale_price REAL,
    guideline_price REAL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (maker_code, product_code)
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
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
    packing_unit TEXT,
    delivery_price REAL,
    standard_wholesale_price REAL,
    desired_wholesale_price REAL,
    guideline_price REAL,
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

  CREATE TABLE IF NOT EXISTS defect_requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    request_date TEXT,
    branch_name TEXT,
    branch_code TEXT,
    supervisor_name TEXT,
    staff_name TEXT,
    employee_number TEXT,
    customer_facility_name TEXT,
    customer_code TEXT,
    department TEXT,
    contact_person TEXT,
    send_destination TEXT,
    send_destination_notes TEXT,
    needs_written_response INTEGER NOT NULL DEFAULT 0,
    needs_replacement INTEGER NOT NULL DEFAULT 0,
    replacement_quantity TEXT,
    replacement_unit TEXT,
    other_notes TEXT,
    planning_comment TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
  );

  CREATE TABLE IF NOT EXISTS defect_request_items (
    id TEXT PRIMARY KEY,
    defect_request_id TEXT NOT NULL REFERENCES defect_requests(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    maker_code TEXT,
    product_code TEXT,
    product_name TEXT,
    packing_unit TEXT,
    quantity TEXT,
    lot_no TEXT,
    defect_category TEXT,
    defect_detail TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_defect_request_items_request_id ON defect_request_items(defect_request_id);

  CREATE TABLE IF NOT EXISTS sample_requests (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    request_no TEXT,
    request_date TEXT,
    destination TEXT,
    requester_employee_number TEXT,
    requester_name TEXT,
    requester_department TEXT,
    responsible_code TEXT,
    responsible_name TEXT,
    purpose TEXT,
    purpose_other_text TEXT,
    current_vendor TEXT,
    current_product TEXT,
    notes TEXT,
    planning_comment TEXT,
    logistics_comment TEXT,
    review_date TEXT,
    planning_processed_date TEXT,
    logistics_processed_date TEXT,
    status TEXT NOT NULL DEFAULT 'submitted'
  );

  CREATE TABLE IF NOT EXISTS sample_request_items (
    id TEXT PRIMARY KEY,
    sample_request_id TEXT NOT NULL REFERENCES sample_requests(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    sample_management_no TEXT,
    maker_code TEXT,
    product_code TEXT,
    product_name TEXT,
    packing_unit TEXT,
    request_quantity TEXT,
    request_unit TEXT,
    customer_code TEXT,
    customer_name TEXT,
    planned_price REAL,
    planned_quantity TEXT,
    planned_date TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sample_request_items_request_id ON sample_request_items(sample_request_id);
`);

function seedProductMasterIfEmpty() {
  const row = db.prepare(`SELECT COUNT(*) AS cnt FROM product_master`).get() as {
    cnt: number;
  };
  if (row.cnt > 0) return;

  const seedPath = path.join(process.cwd(), "data-seed", "product-master.csv");
  if (!fs.existsSync(seedPath)) return;

  const text = fs.readFileSync(seedPath, "utf-8");
  const lines = parseCsvText(text);
  if (lines.length === 0) return;

  const [header, ...dataRows] = lines;
  const col = (name: string) => header.indexOf(name);
  const iMaker = col("maker_code");
  const iProduct = col("product_code");
  const iName = col("product_name");
  const iUnit = col("packing_unit");
  const iStdPrice = col("standard_wholesale_price");
  const iGuidePrice = col("guideline_price");
  if (iMaker < 0 || iProduct < 0 || iName < 0) return;

  const insert = db.prepare(`
    INSERT INTO product_master (
      maker_code, product_code, product_name, packing_unit,
      standard_wholesale_price, guideline_price, updated_at
    ) VALUES (@maker_code, @product_code, @product_name, @packing_unit,
      @standard_wholesale_price, @guideline_price, @updated_at)
    ON CONFLICT(maker_code, product_code) DO NOTHING
  `);

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    for (const row of dataRows) {
      const maker = row[iMaker];
      const product = row[iProduct];
      const name = row[iName];
      if (!maker || !product || !name) continue;
      const toNum = (v: string | undefined) => {
        if (v === undefined || v.trim() === "") return null;
        const n = Number(v);
        return Number.isNaN(n) ? null : n;
      };
      insert.run({
        maker_code: maker,
        product_code: product,
        product_name: name,
        packing_unit: iUnit >= 0 ? row[iUnit] || null : null,
        standard_wholesale_price: iStdPrice >= 0 ? toNum(row[iStdPrice]) : null,
        guideline_price: iGuidePrice >= 0 ? toNum(row[iGuidePrice]) : null,
        updated_at: now,
      });
    }
  });
  tx();
}

seedProductMasterIfEmpty();

export default db;

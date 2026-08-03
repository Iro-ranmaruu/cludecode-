import db from "@/lib/db";

export interface CustomerMasterRecord {
  customerCode: string;
  customerName: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecord(row: any): CustomerMasterRecord {
  return {
    customerCode: row.customer_code,
    customerName: row.customer_name,
    updatedAt: row.updated_at,
  };
}

export function lookupCustomer(customerCode: string): CustomerMasterRecord | null {
  const row = db
    .prepare(`SELECT * FROM customer_master WHERE customer_code = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(customerCode) as any;
  return row ? rowToRecord(row) : null;
}

export function listCustomerMaster(): CustomerMasterRecord[] {
  const rows = db.prepare(`SELECT * FROM customer_master ORDER BY customer_code`).all();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map(rowToRecord);
}

export function upsertCustomerMasterRow(input: {
  customerCode: string;
  customerName: string;
}): void {
  db.prepare(
    `INSERT INTO customer_master (customer_code, customer_name, updated_at)
     VALUES (@customer_code, @customer_name, @updated_at)
     ON CONFLICT(customer_code) DO UPDATE SET
       customer_name = excluded.customer_name,
       updated_at = excluded.updated_at`
  ).run({
    customer_code: input.customerCode,
    customer_name: input.customerName,
    updated_at: new Date().toISOString(),
  });
}

export function deleteCustomerMasterRow(customerCode: string): void {
  db.prepare(`DELETE FROM customer_master WHERE customer_code = ?`).run(customerCode);
}

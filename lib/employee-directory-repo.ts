import { randomUUID } from "crypto";
import db from "@/lib/db";

export interface EmployeeDirectoryRecord {
  id: string;
  employeeNumber: string | null;
  name: string;
  email: string;
  branchName: string | null;
  branchCode: string | null;
  supervisorName: string | null;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecord(row: any): EmployeeDirectoryRecord {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    name: row.name,
    email: row.email,
    branchName: row.branch_name,
    branchCode: row.branch_code,
    supervisorName: row.supervisor_name,
    updatedAt: row.updated_at,
  };
}

export function listEmployeeDirectory(): EmployeeDirectoryRecord[] {
  const rows = db.prepare(`SELECT * FROM employee_directory ORDER BY name`).all();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map(rowToRecord);
}

export function findEmployeeEmail(params: {
  employeeNumber?: string | null;
  name?: string | null;
}): string | null {
  if (params.employeeNumber) {
    const row = db
      .prepare(`SELECT email FROM employee_directory WHERE employee_number = ?`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get(params.employeeNumber) as any;
    if (row) return row.email;
  }
  if (params.name) {
    const row = db
      .prepare(`SELECT email FROM employee_directory WHERE name = ?`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get(params.name) as any;
    if (row) return row.email;
  }
  return null;
}

export function findEmployeeByNumber(employeeNumber: string): EmployeeDirectoryRecord | null {
  const row = db
    .prepare(`SELECT * FROM employee_directory WHERE employee_number = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(employeeNumber) as any;
  return row ? rowToRecord(row) : null;
}

export function upsertEmployeeDirectoryRow(input: {
  employeeNumber: string;
  name: string;
  email: string;
  branchName?: string;
  branchCode?: string;
  supervisorName?: string;
}): void {
  const now = new Date().toISOString();
  const existing = input.employeeNumber
    ? (db
        .prepare(`SELECT id FROM employee_directory WHERE employee_number = ?`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .get(input.employeeNumber) as any)
    : (db
        .prepare(`SELECT id FROM employee_directory WHERE name = ?`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .get(input.name) as any);

  if (existing) {
    db.prepare(
      `UPDATE employee_directory SET employee_number = ?, name = ?, email = ?, branch_name = ?, branch_code = ?, supervisor_name = ?, updated_at = ? WHERE id = ?`
    ).run(
      input.employeeNumber || null,
      input.name,
      input.email,
      input.branchName || null,
      input.branchCode || null,
      input.supervisorName || null,
      now,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO employee_directory (id, employee_number, name, email, branch_name, branch_code, supervisor_name, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      input.employeeNumber || null,
      input.name,
      input.email,
      input.branchName || null,
      input.branchCode || null,
      input.supervisorName || null,
      now
    );
  }
}

export function deleteEmployeeDirectoryRow(id: string): void {
  db.prepare(`DELETE FROM employee_directory WHERE id = ?`).run(id);
}

import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import db from "@/lib/db";

export type UserRole = "企画" | "営業";

export interface UserRecord {
  id: string;
  employeeNumber: string;
  name: string;
  branchName: string | null;
  role: UserRole;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): UserRecord {
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    name: row.name,
    branchName: row.branch_name,
    role: row.role,
  };
}

export function findUserByEmployeeNumber(employeeNumber: string): UserRecord | null {
  const row = db
    .prepare(`SELECT * FROM users WHERE employee_number = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(employeeNumber) as any;
  return row ? rowToUser(row) : null;
}

export function createUser(input: {
  employeeNumber: string;
  password: string;
  name: string;
  branchName: string;
  role: UserRole;
}): UserRecord {
  const existing = db
    .prepare(`SELECT id FROM users WHERE employee_number = ?`)
    .get(input.employeeNumber);
  if (existing) {
    throw new Error("この社員番号は既に登録されています");
  }

  const salt = randomBytes(16).toString("hex");
  const hash = hashPassword(input.password, salt);
  const id = randomUUID();

  db.prepare(
    `INSERT INTO users (id, employee_number, password_hash, password_salt, name, branch_name, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.employeeNumber,
    hash,
    salt,
    input.name,
    input.branchName,
    input.role,
    new Date().toISOString()
  );

  return { id, employeeNumber: input.employeeNumber, name: input.name, branchName: input.branchName, role: input.role };
}

export function verifyPassword(employeeNumber: string, password: string): UserRecord | null {
  const row = db
    .prepare(`SELECT * FROM users WHERE employee_number = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(employeeNumber) as any;
  if (!row) return null;

  const candidateHash = hashPassword(password, row.password_salt);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(row.password_hash as string, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return rowToUser(row);
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_MS);
  db.prepare(
    `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`
  ).run(token, userId, now.toISOString(), expires.toISOString());
  return token;
}

export function deleteSession(token: string): void {
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function getUserBySessionToken(token: string): UserRecord | null {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(token, new Date().toISOString()) as any;
  return row ? rowToUser(row) : null;
}

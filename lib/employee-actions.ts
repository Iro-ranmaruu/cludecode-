"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { parseCsvLine } from "@/lib/csv";
import {
  deleteEmployeeDirectoryRow,
  upsertEmployeeDirectoryRow,
} from "@/lib/employee-directory-repo";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

async function requirePlanningUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "企画") {
    throw new Error("この操作には企画権限が必要です");
  }
  return user;
}

export async function importEmployeeDirectoryCsvAction(formData: FormData) {
  await requirePlanningUser();

  const csvText = str(formData, "csvText");
  const lines = csvText
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l !== "");

  let imported = 0;
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const [employeeNumber, name, email, branchName, branchCode, supervisorName] = cells;
    if (!name || !email) continue;
    // Skip an obvious header row.
    if (imported === 0 && /氏名|name/i.test(name) && /メール|email/i.test(email)) {
      continue;
    }
    upsertEmployeeDirectoryRow({
      employeeNumber: (employeeNumber || "").trim(),
      name: name.trim(),
      email: email.trim(),
      branchName: (branchName || "").trim(),
      branchCode: (branchCode || "").trim(),
      supervisorName: (supervisorName || "").trim(),
    });
    imported++;
  }

  revalidatePath("/employees");
}

export async function addEmployeeDirectoryRowAction(formData: FormData) {
  await requirePlanningUser();

  const employeeNumber = str(formData, "employeeNumber").trim();
  const name = str(formData, "name").trim();
  const email = str(formData, "email").trim();
  const branchName = str(formData, "branchName").trim();
  const branchCode = str(formData, "branchCode").trim();
  const supervisorName = str(formData, "supervisorName").trim();

  if (!name || !email) {
    throw new Error("氏名・メールアドレスを入力してください");
  }

  upsertEmployeeDirectoryRow({ employeeNumber, name, email, branchName, branchCode, supervisorName });
  revalidatePath("/employees");
}

export async function deleteEmployeeDirectoryRowAction(formData: FormData) {
  await requirePlanningUser();

  const id = str(formData, "id");
  deleteEmployeeDirectoryRow(id);
  revalidatePath("/employees");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { parseCsvLine } from "@/lib/csv";
import {
  deleteCustomerMasterRow,
  upsertCustomerMasterRow,
} from "@/lib/customer-master-repo";

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

export async function importCustomerMasterCsvAction(formData: FormData) {
  await requirePlanningUser();

  const csvText = str(formData, "csvText");
  const lines = csvText
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l !== "");

  let imported = 0;
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const [customerCode, customerName] = cells;
    if (!customerCode || !customerName) continue;
    // Skip an obvious header row.
    if (imported === 0 && /得意先コード|customer.?code/i.test(customerCode)) {
      continue;
    }
    upsertCustomerMasterRow({
      customerCode: customerCode.trim().toUpperCase(),
      customerName: customerName.trim(),
    });
    imported++;
  }

  revalidatePath("/customers");
}

export async function addCustomerMasterRowAction(formData: FormData) {
  await requirePlanningUser();

  const customerCode = str(formData, "customerCode").trim().toUpperCase();
  const customerName = str(formData, "customerName").trim();

  if (!customerCode || !customerName) {
    throw new Error("得意先コード・得意先名を入力してください");
  }

  upsertCustomerMasterRow({ customerCode, customerName });
  revalidatePath("/customers");
}

export async function deleteCustomerMasterRowAction(formData: FormData) {
  await requirePlanningUser();

  const customerCode = str(formData, "customerCode");
  deleteCustomerMasterRow(customerCode);
  revalidatePath("/customers");
}

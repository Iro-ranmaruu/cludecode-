"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  deleteProductMasterRow,
  upsertProductMasterRow,
} from "@/lib/product-master-repo";

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

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cells.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

export async function importProductMasterCsvAction(formData: FormData) {
  await requirePlanningUser();

  const csvText = str(formData, "csvText");
  const lines = csvText
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l !== "");

  let imported = 0;
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const [makerCode, productCode, productName, packingUnit] = cells;
    if (!makerCode || !productCode || !productName) continue;
    // Skip an obvious header row.
    if (
      imported === 0 &&
      /メーカーコード|maker.?code/i.test(makerCode) &&
      /商品コード|product.?code/i.test(productCode)
    ) {
      continue;
    }
    upsertProductMasterRow({
      makerCode: makerCode.trim(),
      productCode: productCode.trim(),
      productName: productName.trim(),
      packingUnit: (packingUnit || "").trim(),
    });
    imported++;
  }

  revalidatePath("/master");
}

export async function addProductMasterRowAction(formData: FormData) {
  await requirePlanningUser();

  const makerCode = str(formData, "makerCode").trim();
  const productCode = str(formData, "productCode").trim();
  const productName = str(formData, "productName").trim();
  const packingUnit = str(formData, "packingUnit").trim();

  if (!makerCode || !productCode || !productName) {
    throw new Error("メーカーコード・商品コード・商品名を入力してください");
  }

  upsertProductMasterRow({ makerCode, productCode, productName, packingUnit });
  revalidatePath("/master");
}

export async function deleteProductMasterRowAction(formData: FormData) {
  await requirePlanningUser();

  const makerCode = str(formData, "makerCode");
  const productCode = str(formData, "productCode");
  deleteProductMasterRow(makerCode, productCode);
  revalidatePath("/master");
}

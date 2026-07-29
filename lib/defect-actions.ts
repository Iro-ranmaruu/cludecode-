"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createDefectRequest,
  getDefectRequestById,
  updateDefectRequestStatus,
} from "@/lib/defect-repo";
import { getCurrentUser } from "@/lib/session";
import { notifyFuguaiStatusChange } from "@/lib/notifications";
import type { DefectItemInput, DefectRequestInput, DefectStatus } from "@/lib/defect-types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function submitDefectRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const itemCount = Number(formData.get("itemCount") || 0);
  const items: DefectItemInput[] = [];
  for (let i = 0; i < itemCount; i++) {
    const productName = str(formData, `items[${i}][productName]`);
    const hasAnyValue = [
      "makerCode",
      "productCode",
      "productName",
      "quantity",
      "lotNo",
      "defectDetail",
    ].some((field) => str(formData, `items[${i}][${field}]`).trim() !== "");
    if (!hasAnyValue) continue;

    items.push({
      makerCode: str(formData, `items[${i}][makerCode]`),
      productCode: str(formData, `items[${i}][productCode]`),
      productName,
      packingUnit: str(formData, `items[${i}][packingUnit]`),
      quantity: str(formData, `items[${i}][quantity]`),
      lotNo: str(formData, `items[${i}][lotNo]`),
      defectCategory: str(formData, `items[${i}][defectCategory]`),
      defectDetail: str(formData, `items[${i}][defectDetail]`),
    });
  }

  const input: DefectRequestInput = {
    createdBy: user.id,
    requestDate: str(formData, "requestDate"),
    branchName: str(formData, "branchName"),
    branchCode: str(formData, "branchCode"),
    supervisorName: str(formData, "supervisorName"),
    staffName: str(formData, "staffName"),
    employeeNumber: str(formData, "employeeNumber"),
    customerFacilityName: str(formData, "customerFacilityName"),
    customerCode: str(formData, "customerCode"),
    department: str(formData, "department"),
    contactPerson: str(formData, "contactPerson"),
    sendDestination: str(formData, "sendDestination"),
    sendDestinationNotes: str(formData, "sendDestinationNotes"),
    needsWrittenResponse: str(formData, "needsWrittenResponse") === "on",
    needsReplacement: str(formData, "needsReplacement") === "on",
    replacementQuantity: str(formData, "replacementQuantity"),
    replacementUnit: str(formData, "replacementUnit"),
    otherNotes: str(formData, "otherNotes"),
    items,
  };

  if (!input.branchName || !input.staffName || items.length === 0) {
    throw new Error("店所名・担当者名・商品明細を1件以上入力してください");
  }

  const id = createDefectRequest(input);
  revalidatePath("/fuguai/requests");
  redirect(`/fuguai/requests/${id}?submitted=1`);
}

export async function updateDefectStatusAction(formData: FormData) {
  const requestId = str(formData, "requestId");
  const status = str(formData, "status") as DefectStatus;
  const planningComment = str(formData, "planningComment");

  const before = getDefectRequestById(requestId);

  updateDefectRequestStatus(requestId, status, planningComment);

  revalidatePath(`/fuguai/requests/${requestId}`);
  revalidatePath("/fuguai/requests");

  const after = getDefectRequestById(requestId);
  if (after && before && before.status !== after.status) {
    await notifyFuguaiStatusChange(after);
  }
}

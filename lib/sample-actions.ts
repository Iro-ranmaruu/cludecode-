"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSampleRequest,
  getSampleRequestById,
  updateSampleRequestProcessing,
} from "@/lib/sample-repo";
import { getCurrentUser } from "@/lib/session";
import { notifySampleStatusChange } from "@/lib/notifications";
import type { SampleItemInput, SampleRequestInput, SampleStatus } from "@/lib/sample-types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function submitSampleRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const itemCount = Number(formData.get("itemCount") || 0);
  const items: SampleItemInput[] = [];
  for (let i = 0; i < itemCount; i++) {
    const productName = str(formData, `items[${i}][productName]`);
    const hasAnyValue = [
      "makerCode",
      "productCode",
      "productName",
      "requestQuantity",
      "customerCode",
      "customerName",
    ].some((field) => str(formData, `items[${i}][${field}]`).trim() !== "");
    if (!hasAnyValue) continue;

    items.push({
      sampleManagementNo: str(formData, `items[${i}][sampleManagementNo]`),
      makerCode: str(formData, `items[${i}][makerCode]`),
      productCode: str(formData, `items[${i}][productCode]`),
      productName,
      packingUnit: str(formData, `items[${i}][packingUnit]`),
      requestQuantity: str(formData, `items[${i}][requestQuantity]`),
      requestUnit: str(formData, `items[${i}][requestUnit]`),
      customerCode: str(formData, `items[${i}][customerCode]`),
      customerName: str(formData, `items[${i}][customerName]`),
      plannedPrice: str(formData, `items[${i}][plannedPrice]`),
      plannedQuantity: str(formData, `items[${i}][plannedQuantity]`),
      plannedDate: str(formData, `items[${i}][plannedDate]`),
    });
  }

  const input: SampleRequestInput = {
    createdBy: user.id,
    requestDate: str(formData, "requestDate"),
    destination: str(formData, "destination"),
    requesterEmployeeNumber: str(formData, "requesterEmployeeNumber"),
    requesterName: str(formData, "requesterName"),
    requesterDepartment: str(formData, "requesterDepartment"),
    responsibleCode: str(formData, "responsibleCode"),
    responsibleName: str(formData, "responsibleName"),
    purpose: str(formData, "purpose"),
    purposeOtherText: str(formData, "purposeOtherText"),
    currentVendor: str(formData, "currentVendor"),
    currentProduct: str(formData, "currentProduct"),
    notes: str(formData, "notes"),
    items,
  };

  if (!input.requesterName || items.length === 0) {
    throw new Error("申請者情報・商品明細を1件以上入力してください");
  }

  const id = createSampleRequest(input);
  revalidatePath("/sample/requests");
  redirect(`/sample/requests/${id}?submitted=1`);
}

export async function updateSampleProcessingAction(formData: FormData) {
  const requestId = str(formData, "requestId");

  const before = getSampleRequestById(requestId);

  updateSampleRequestProcessing(requestId, {
    status: str(formData, "status") as SampleStatus,
    planningComment: str(formData, "planningComment"),
    logisticsComment: str(formData, "logisticsComment"),
    reviewDate: str(formData, "reviewDate"),
    planningProcessedDate: str(formData, "planningProcessedDate"),
    logisticsProcessedDate: str(formData, "logisticsProcessedDate"),
  });

  revalidatePath(`/sample/requests/${requestId}`);
  revalidatePath("/sample/requests");

  const after = getSampleRequestById(requestId);
  if (after && before && before.status !== after.status) {
    await notifySampleStatusChange(after);
  }
}

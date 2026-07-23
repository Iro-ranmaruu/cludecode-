"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRequest,
  updateItemDecision,
  updatePlanningRemarks,
} from "@/lib/requests-repo";
import type { ItemDecision, RequestInput, RequestItemInput } from "@/lib/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function submitRequestAction(formData: FormData) {
  const itemCount = Number(formData.get("itemCount") || 0);
  const items: RequestItemInput[] = [];
  for (let i = 0; i < itemCount; i++) {
    const productName = str(formData, `items[${i}][productName]`);
    // Skip fully-empty rows (e.g. a leftover row after client-side removal).
    const hasAnyValue = [
      "productName",
      "makerCode",
      "productCode",
      "deliveryPrice",
      "standardWholesalePrice",
      "desiredWholesalePrice",
      "monthlyAvgSales",
      "productAbbreviation",
    ].some((field) => str(formData, `items[${i}][${field}]`).trim() !== "");
    if (!hasAnyValue) continue;

    items.push({
      productName,
      makerCode: str(formData, `items[${i}][makerCode]`),
      productCode: str(formData, `items[${i}][productCode]`),
      deliveryPrice: str(formData, `items[${i}][deliveryPrice]`),
      standardWholesalePrice: str(formData, `items[${i}][standardWholesalePrice]`),
      desiredWholesalePrice: str(formData, `items[${i}][desiredWholesalePrice]`),
      monthlyAvgSales: str(formData, `items[${i}][monthlyAvgSales]`),
      existingSpecialPriceFlag:
        str(formData, `items[${i}][existingSpecialPriceFlag]`) === "on",
      deliveryStartDate: str(formData, `items[${i}][deliveryStartDate]`),
      registerSpecialPrice: str(formData, `items[${i}][registerSpecialPrice]`),
      endDate: str(formData, `items[${i}][endDate]`),
      productAbbreviation: str(formData, `items[${i}][productAbbreviation]`),
    });
  }

  const customerCodesRaw = formData.getAll("customerCodes[]");
  const customerCodes = customerCodesRaw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v !== "");

  const input: RequestInput = {
    applicationDate: str(formData, "applicationDate"),
    branchName: str(formData, "branchName"),
    branchCode: str(formData, "branchCode"),
    supervisorName: str(formData, "supervisorName"),
    staffName: str(formData, "staffName"),
    employeeNumber: str(formData, "employeeNumber"),
    customerFacilityName: str(formData, "customerFacilityName"),
    deliveryDepartment: str(formData, "deliveryDepartment"),
    customerCodes,
    competitorMakerName: str(formData, "competitorMakerName"),
    competitorProductName: str(formData, "competitorProductName"),
    competitorProductCode: str(formData, "competitorProductCode"),
    competitorJanCode: str(formData, "competitorJanCode"),
    competitorPurchasePrice: str(formData, "competitorPurchasePrice"),
    competitorDeliveryPrice: str(formData, "competitorDeliveryPrice"),
    competitorVendor: str(formData, "competitorVendor"),
    reasonType: str(formData, "reasonType"),
    specialNotes: str(formData, "specialNotes"),
    items,
  };

  if (!input.branchName || !input.staffName || items.length === 0) {
    throw new Error("店所名・担当者名・商品明細を1件以上入力してください");
  }

  const id = createRequest(input);
  revalidatePath("/requests");
  redirect(`/requests/${id}?submitted=1`);
}

export async function updateItemDecisionAction(formData: FormData) {
  const itemId = str(formData, "itemId");
  const requestId = str(formData, "requestId");
  const decision = str(formData, "decision") as ItemDecision;
  const decidedWholesalePrice = str(formData, "decidedWholesalePrice");

  updateItemDecision(
    itemId,
    decision,
    decidedWholesalePrice.trim() === "" ? null : decidedWholesalePrice
  );

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}

export async function updatePlanningRemarksAction(formData: FormData) {
  const requestId = str(formData, "requestId");
  const remarks = str(formData, "remarks");
  updatePlanningRemarks(requestId, remarks);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}

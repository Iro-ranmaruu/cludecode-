export type ItemDecision = "未決定" | "承認" | "却下" | "金額変更";

export type RequestStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "partially_approved";

export const STATUS_LABEL: Record<RequestStatus, string> = {
  submitted: "申請中",
  approved: "承認",
  rejected: "却下",
  partially_approved: "一部承認・金額変更あり",
};

export interface RequestItemInput {
  productName: string;
  makerCode: string;
  productCode: string;
  packingUnit: string;
  deliveryPrice: string;
  standardWholesalePrice: string;
  desiredWholesalePrice: string;
  guidelinePrice: string;
  monthlyAvgSales: string;
  existingSpecialPriceFlag: boolean;
  deliveryStartDate: string;
  registerSpecialPrice: string;
  endDate: string;
  productAbbreviation: string;
}

export interface RequestInput {
  createdBy?: string;
  applicationDate: string;
  branchName: string;
  branchCode: string;
  supervisorName: string;
  staffName: string;
  employeeNumber: string;
  customerFacilityName: string;
  deliveryDepartment: string;
  customerCodes: string[];
  competitorMakerName: string;
  competitorProductName: string;
  competitorProductCode: string;
  competitorJanCode: string;
  competitorPurchasePrice: string;
  competitorDeliveryPrice: string;
  competitorVendor: string;
  reasonType: string;
  specialNotes: string;
  preApprovedByPlanning: boolean;
  items: RequestItemInput[];
}

export interface RequestItemRecord {
  id: string;
  requestId: string;
  orderIndex: number;
  productName: string | null;
  makerCode: string | null;
  productCode: string | null;
  packingUnit: string | null;
  deliveryPrice: number | null;
  standardWholesalePrice: number | null;
  desiredWholesalePrice: number | null;
  guidelinePrice: number | null;
  monthlyAvgSales: string | null;
  existingSpecialPriceFlag: boolean;
  deliveryStartDate: string | null;
  registerSpecialPrice: string | null;
  endDate: string | null;
  productAbbreviation: string | null;
  decision: ItemDecision;
  decidedWholesalePrice: number | null;
}

export interface RequestRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  applicationDate: string | null;
  branchName: string | null;
  branchCode: string | null;
  supervisorName: string | null;
  staffName: string | null;
  employeeNumber: string | null;
  customerFacilityName: string | null;
  deliveryDepartment: string | null;
  customerCodes: string[];
  competitorMakerName: string | null;
  competitorProductName: string | null;
  competitorProductCode: string | null;
  competitorJanCode: string | null;
  competitorPurchasePrice: string | null;
  competitorDeliveryPrice: string | null;
  competitorVendor: string | null;
  reasonType: string | null;
  specialNotes: string | null;
  preApprovedByPlanning: boolean;
  planningRemarks: string | null;
  status: RequestStatus;
  items: RequestItemRecord[];
}

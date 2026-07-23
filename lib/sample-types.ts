export type SampleStatus = "submitted" | "in_progress" | "completed" | "rejected";

export const SAMPLE_STATUS_LABEL: Record<SampleStatus, string> = {
  submitted: "申請中",
  in_progress: "処理中",
  completed: "完了",
  rejected: "却下",
};

export const DESTINATION_OPTIONS = ["北海道", "東京", "大阪", "九州"] as const;
export const PURPOSE_OPTIONS = ["切替提案", "新規開拓", "クレーム", "その他"] as const;

export interface SampleItemInput {
  sampleManagementNo: string;
  makerCode: string;
  productCode: string;
  productName: string;
  packingUnit: string;
  requestQuantity: string;
  requestUnit: string;
  customerCode: string;
  customerName: string;
  plannedPrice: string;
  plannedQuantity: string;
  plannedDate: string;
}

export interface SampleRequestInput {
  createdBy?: string;
  requestDate: string;
  destination: string;
  requesterEmployeeNumber: string;
  requesterName: string;
  requesterDepartment: string;
  responsibleCode: string;
  responsibleName: string;
  purpose: string;
  purposeOtherText: string;
  currentVendor: string;
  currentProduct: string;
  notes: string;
  items: SampleItemInput[];
}

export interface SampleItemRecord {
  id: string;
  requestId: string;
  orderIndex: number;
  sampleManagementNo: string | null;
  makerCode: string | null;
  productCode: string | null;
  productName: string | null;
  packingUnit: string | null;
  requestQuantity: string | null;
  requestUnit: string | null;
  customerCode: string | null;
  customerName: string | null;
  plannedPrice: number | null;
  plannedQuantity: string | null;
  plannedDate: string | null;
}

export interface SampleRequestRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  requestNo: string | null;
  requestDate: string | null;
  destination: string | null;
  requesterEmployeeNumber: string | null;
  requesterName: string | null;
  requesterDepartment: string | null;
  responsibleCode: string | null;
  responsibleName: string | null;
  purpose: string | null;
  purposeOtherText: string | null;
  currentVendor: string | null;
  currentProduct: string | null;
  notes: string | null;
  planningComment: string | null;
  logisticsComment: string | null;
  reviewDate: string | null;
  planningProcessedDate: string | null;
  logisticsProcessedDate: string | null;
  status: SampleStatus;
  items: SampleItemRecord[];
}

export type DefectStatus = "submitted" | "in_progress" | "completed" | "rejected";

export const DEFECT_STATUS_LABEL: Record<DefectStatus, string> = {
  submitted: "申請中",
  in_progress: "対応中",
  completed: "完了",
  rejected: "却下",
};

export const DEFECT_CATEGORY_OPTIONS = [
  "異物混入",
  "汚れ",
  "包装の破損不備",
  "製品の破損不備",
  "その他",
] as const;

export const SEND_DESTINATION_OPTIONS = [
  "メーカーに送付した",
  "営業企画に送付した",
  "WiSM企画に送付した",
  "回収済みだが未発送",
  "未回収",
] as const;

export interface DefectItemInput {
  makerCode: string;
  productCode: string;
  productName: string;
  packingUnit: string;
  quantity: string;
  lotNo: string;
  defectCategory: string;
  defectDetail: string;
}

export interface DefectRequestInput {
  createdBy?: string;
  requestDate: string;
  branchName: string;
  branchCode: string;
  supervisorName: string;
  staffName: string;
  employeeNumber: string;
  customerFacilityName: string;
  customerCode: string;
  department: string;
  contactPerson: string;
  sendDestination: string;
  sendDestinationNotes: string;
  needsWrittenResponse: boolean;
  needsReplacement: boolean;
  replacementQuantity: string;
  replacementUnit: string;
  otherNotes: string;
  items: DefectItemInput[];
}

export interface DefectItemRecord {
  id: string;
  requestId: string;
  orderIndex: number;
  makerCode: string | null;
  productCode: string | null;
  productName: string | null;
  packingUnit: string | null;
  quantity: string | null;
  lotNo: string | null;
  defectCategory: string | null;
  defectDetail: string | null;
}

export interface DefectRequestRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  requestDate: string | null;
  branchName: string | null;
  branchCode: string | null;
  supervisorName: string | null;
  staffName: string | null;
  employeeNumber: string | null;
  customerFacilityName: string | null;
  customerCode: string | null;
  department: string | null;
  contactPerson: string | null;
  sendDestination: string | null;
  sendDestinationNotes: string | null;
  needsWrittenResponse: boolean;
  needsReplacement: boolean;
  replacementQuantity: string | null;
  replacementUnit: string | null;
  otherNotes: string | null;
  planningComment: string | null;
  status: DefectStatus;
  items: DefectItemRecord[];
}

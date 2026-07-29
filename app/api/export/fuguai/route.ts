import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listDefectRequests } from "@/lib/defect-repo";
import { toCsv, csvResponseHeaders, inDateRange } from "@/lib/csv-export";

const HEADERS = [
  "依頼ID",
  "依頼日",
  "店所名",
  "店所コード",
  "所属長名",
  "担当者名",
  "社員番号",
  "得意先施設名",
  "得意先コード",
  "部署",
  "担当者",
  "送付先",
  "送付先備考",
  "始末書要否",
  "交換要否",
  "交換数量",
  "交換単位",
  "その他備考",
  "企画コメント",
  "ステータス",
  "商品行番号",
  "メーカーコード",
  "商品コード",
  "商品名",
  "梱包単位",
  "数量",
  "ロットNO.",
  "不具合内容",
  "不具合内容詳細",
  "作成日時",
  "更新日時",
];

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "企画") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const from = request.nextUrl.searchParams.get("from") || "";
  const to = request.nextUrl.searchParams.get("to") || "";

  const requests = listDefectRequests().filter((r) => inDateRange(r.requestDate, from, to));
  const rows: (string | number | null)[][] = [];
  for (const r of requests) {
    const base = [
      r.id,
      r.requestDate,
      r.branchName,
      r.branchCode,
      r.supervisorName,
      r.staffName,
      r.employeeNumber,
      r.customerFacilityName,
      r.customerCode,
      r.department,
      r.contactPerson,
      r.sendDestination,
      r.sendDestinationNotes,
      r.needsWrittenResponse ? "要" : "不要",
      r.needsReplacement ? "要" : "不要",
      r.replacementQuantity,
      r.replacementUnit,
      r.otherNotes,
      r.planningComment,
      r.status,
    ];
    if (r.items.length === 0) {
      rows.push([...base, null, null, null, null, null, null, null, null, null, r.createdAt, r.updatedAt]);
      continue;
    }
    r.items.forEach((item, index) => {
      rows.push([
        ...base,
        index + 1,
        item.makerCode,
        item.productCode,
        item.productName,
        item.packingUnit,
        item.quantity,
        item.lotNo,
        item.defectCategory,
        item.defectDetail,
        r.createdAt,
        r.updatedAt,
      ]);
    });
  }

  const csv = toCsv(HEADERS, rows);
  const filename = `fuguai_requests_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listRequests } from "@/lib/requests-repo";
import { toCsv, csvResponseHeaders, inDateRange } from "@/lib/csv-export";

const HEADERS = [
  "申請ID",
  "申請日",
  "店所名",
  "店所コード",
  "所属長名",
  "担当者名",
  "社員番号",
  "得意先施設名",
  "施設内の納入部署",
  "得意先コード",
  "ステータス",
  "特価申請理由",
  "WiSM企画事前承認済み",
  "特記事項",
  "企画備考",
  "商品行番号",
  "メーカーコード",
  "商品コード",
  "商品名",
  "梱包単位",
  "納入価",
  "通常仕切",
  "希望仕切額",
  "特価目安",
  "月平均販売量",
  "特価登録もする？",
  "同商品同得意先で特価登録済み",
  "納入開始日",
  "終了日",
  "商品略称",
  "判定",
  "決定仕切額",
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

  const requests = listRequests().filter((r) => inDateRange(r.applicationDate, from, to));
  const rows: (string | number | null)[][] = [];
  for (const r of requests) {
    if (r.items.length === 0) {
      rows.push([
        r.id,
        r.applicationDate,
        r.branchName,
        r.branchCode,
        r.supervisorName,
        r.staffName,
        r.employeeNumber,
        r.customerFacilityName,
        r.deliveryDepartment,
        r.customerCodes.join(" / "),
        r.status,
        r.reasonType,
        r.preApprovedByPlanning ? "済み" : "",
        r.specialNotes,
        r.planningRemarks,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        r.createdAt,
        r.updatedAt,
      ]);
      continue;
    }
    r.items.forEach((item, index) => {
      rows.push([
        r.id,
        r.applicationDate,
        r.branchName,
        r.branchCode,
        r.supervisorName,
        r.staffName,
        r.employeeNumber,
        r.customerFacilityName,
        r.deliveryDepartment,
        r.customerCodes.join(" / "),
        r.status,
        r.reasonType,
        r.preApprovedByPlanning ? "済み" : "",
        r.specialNotes,
        r.planningRemarks,
        index + 1,
        item.makerCode,
        item.productCode,
        item.productName,
        item.packingUnit,
        item.deliveryPrice,
        item.standardWholesalePrice,
        item.desiredWholesalePrice,
        item.guidelinePrice,
        item.monthlyAvgSales,
        item.registerSpecialPrice,
        item.existingSpecialPriceFlag ? "はい" : "いいえ",
        item.deliveryStartDate,
        item.endDate,
        item.productAbbreviation,
        item.decision,
        item.decidedWholesalePrice,
        r.createdAt,
        r.updatedAt,
      ]);
    });
  }

  const csv = toCsv(HEADERS, rows);
  const filename = `tokka_requests_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}

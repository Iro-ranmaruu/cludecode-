import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listSampleRequests } from "@/lib/sample-repo";
import { toCsv, csvResponseHeaders } from "@/lib/csv-export";

const HEADERS = [
  "依頼ID",
  "サンプル依頼No",
  "申請日",
  "送付先",
  "申請者社員番号",
  "申請者名",
  "申請者部署",
  "責任者コード",
  "責任者名",
  "目的",
  "目的（その他）",
  "現行仕入先",
  "現行商品",
  "備考",
  "企画コメント",
  "物流コメント",
  "審査日",
  "企画処理日",
  "物流処理日",
  "ステータス",
  "商品行番号",
  "サンプル管理番号",
  "メーカーコード",
  "商品コード",
  "商品名",
  "梱包単位",
  "依頼数量",
  "依頼単位",
  "得意先コード",
  "得意先名",
  "納入予定価格",
  "納入予定数量",
  "納入予定日",
  "作成日時",
  "更新日時",
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "企画") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const requests = listSampleRequests();
  const rows: (string | number | null)[][] = [];
  for (const r of requests) {
    const base = [
      r.id,
      r.requestNo,
      r.requestDate,
      r.destination,
      r.requesterEmployeeNumber,
      r.requesterName,
      r.requesterDepartment,
      r.responsibleCode,
      r.responsibleName,
      r.purpose,
      r.purposeOtherText,
      r.currentVendor,
      r.currentProduct,
      r.notes,
      r.planningComment,
      r.logisticsComment,
      r.reviewDate,
      r.planningProcessedDate,
      r.logisticsProcessedDate,
      r.status,
    ];
    if (r.items.length === 0) {
      rows.push([...base, null, null, null, null, null, null, null, null, null, null, null, null, null, r.createdAt, r.updatedAt]);
      continue;
    }
    r.items.forEach((item, index) => {
      rows.push([
        ...base,
        index + 1,
        item.sampleManagementNo,
        item.makerCode,
        item.productCode,
        item.productName,
        item.packingUnit,
        item.requestQuantity,
        item.requestUnit,
        item.customerCode,
        item.customerName,
        item.plannedPrice,
        item.plannedQuantity,
        item.plannedDate,
        r.createdAt,
        r.updatedAt,
      ]);
    });
  }

  const csv = toCsv(HEADERS, rows);
  const filename = `sample_requests_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}

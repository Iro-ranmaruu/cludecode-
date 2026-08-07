import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { searchProductMasterByName } from "@/lib/product-master-repo";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = searchProductMasterByName(query, 20).map((p) => ({
    makerCode: p.makerCode,
    productCode: p.productCode,
    productName: p.productName,
    packingUnit: p.packingUnit || "",
    standardWholesalePrice: p.standardWholesalePrice,
    guidelinePrice: p.guidelinePrice,
  }));

  return NextResponse.json({ results });
}

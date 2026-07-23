import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { lookupProduct } from "@/lib/product-master-repo";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const makerCode = request.nextUrl.searchParams.get("makerCode")?.trim() || "";
  const productCode = request.nextUrl.searchParams.get("productCode")?.trim() || "";
  if (!makerCode || !productCode) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const product = lookupProduct(makerCode, productCode);
  if (!product) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    productName: product.productName,
    packingUnit: product.packingUnit || "",
  });
}

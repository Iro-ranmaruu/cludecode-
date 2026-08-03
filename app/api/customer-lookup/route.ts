import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { lookupCustomer } from "@/lib/customer-master-repo";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const customerCode = request.nextUrl.searchParams.get("customerCode")?.trim() || "";
  if (!customerCode) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const customer = lookupCustomer(customerCode);
  if (!customer) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    customerName: customer.customerName,
  });
}

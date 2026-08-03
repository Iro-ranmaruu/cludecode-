import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { findEmployeeByNumber } from "@/lib/employee-directory-repo";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const employeeNumber = request.nextUrl.searchParams.get("employeeNumber")?.trim() || "";
  if (!employeeNumber) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const employee = findEmployeeByNumber(employeeNumber);
  if (!employee) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    name: employee.name,
    branchName: employee.branchName || "",
    branchCode: employee.branchCode || "",
    supervisorName: employee.supervisorName || "",
  });
}

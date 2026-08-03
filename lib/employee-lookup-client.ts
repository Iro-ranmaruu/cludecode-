export interface EmployeeLookupResult {
  name: string;
  branchName: string;
  branchCode: string;
  supervisorName: string;
}

export async function fetchEmployeeInfo(
  employeeNumber: string
): Promise<EmployeeLookupResult | null> {
  const num = employeeNumber.trim();
  if (!num) return null;

  try {
    const params = new URLSearchParams({ employeeNumber: num });
    const res = await fetch(`/api/employee-lookup?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.found) return null;
    return {
      name: data.name,
      branchName: data.branchName,
      branchCode: data.branchCode,
      supervisorName: data.supervisorName,
    };
  } catch {
    return null;
  }
}

export interface CustomerLookupResult {
  customerName: string;
}

export async function fetchCustomerInfo(
  customerCode: string
): Promise<CustomerLookupResult | null> {
  const code = customerCode.trim();
  if (!code) return null;

  try {
    const params = new URLSearchParams({ customerCode: code });
    const res = await fetch(`/api/customer-lookup?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.found) return null;
    return { customerName: data.customerName };
  } catch {
    return null;
  }
}

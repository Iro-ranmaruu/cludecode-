export interface ProductLookupResult {
  productName: string;
  packingUnit: string;
}

export async function fetchProductInfo(
  makerCode: string,
  productCode: string
): Promise<ProductLookupResult | null> {
  const mc = makerCode.trim();
  const pc = productCode.trim();
  if (!mc || !pc) return null;

  try {
    const params = new URLSearchParams({ makerCode: mc, productCode: pc });
    const res = await fetch(`/api/product-lookup?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.found) return null;
    return { productName: data.productName, packingUnit: data.packingUnit };
  } catch {
    return null;
  }
}

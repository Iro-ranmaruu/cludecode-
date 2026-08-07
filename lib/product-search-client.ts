export interface ProductSearchResult {
  makerCode: string;
  productCode: string;
  productName: string;
  packingUnit: string;
  standardWholesalePrice: number | null;
  guidelinePrice: number | null;
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const params = new URLSearchParams({ q });
    const res = await fetch(`/api/product-search?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

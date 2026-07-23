import db from "@/lib/db";

export interface ProductMasterRecord {
  makerCode: string;
  productCode: string;
  productName: string;
  packingUnit: string | null;
  standardWholesalePrice: number | null;
  guidelinePrice: number | null;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecord(row: any): ProductMasterRecord {
  return {
    makerCode: row.maker_code,
    productCode: row.product_code,
    productName: row.product_name,
    packingUnit: row.packing_unit,
    standardWholesalePrice: row.standard_wholesale_price,
    guidelinePrice: row.guideline_price,
    updatedAt: row.updated_at,
  };
}

export function lookupProduct(
  makerCode: string,
  productCode: string
): ProductMasterRecord | null {
  const row = db
    .prepare(
      `SELECT * FROM product_master WHERE maker_code = ? AND product_code = ?`
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(makerCode, productCode) as any;
  return row ? rowToRecord(row) : null;
}

export function listProductMaster(): ProductMasterRecord[] {
  const rows = db
    .prepare(`SELECT * FROM product_master ORDER BY maker_code, product_code`)
    .all();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map(rowToRecord);
}

export function upsertProductMasterRow(input: {
  makerCode: string;
  productCode: string;
  productName: string;
  packingUnit: string;
  standardWholesalePrice: number | null;
  guidelinePrice: number | null;
}): void {
  db.prepare(
    `INSERT INTO product_master (
       maker_code, product_code, product_name, packing_unit,
       standard_wholesale_price, guideline_price, updated_at
     )
     VALUES (@maker_code, @product_code, @product_name, @packing_unit,
       @standard_wholesale_price, @guideline_price, @updated_at)
     ON CONFLICT(maker_code, product_code) DO UPDATE SET
       product_name = excluded.product_name,
       packing_unit = excluded.packing_unit,
       standard_wholesale_price = excluded.standard_wholesale_price,
       guideline_price = excluded.guideline_price,
       updated_at = excluded.updated_at`
  ).run({
    maker_code: input.makerCode,
    product_code: input.productCode,
    product_name: input.productName,
    packing_unit: input.packingUnit || null,
    standard_wholesale_price: input.standardWholesalePrice,
    guideline_price: input.guidelinePrice,
    updated_at: new Date().toISOString(),
  });
}

export function deleteProductMasterRow(makerCode: string, productCode: string): void {
  db.prepare(
    `DELETE FROM product_master WHERE maker_code = ? AND product_code = ?`
  ).run(makerCode, productCode);
}

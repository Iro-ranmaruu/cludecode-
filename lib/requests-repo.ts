import { randomUUID } from "crypto";
import db from "@/lib/db";
import type {
  ItemDecision,
  RequestInput,
  RequestItemRecord,
  RequestRecord,
  RequestStatus,
} from "@/lib/types";

function toNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function computeStatus(items: { decision: ItemDecision }[]): RequestStatus {
  if (items.length === 0) return "submitted";
  if (items.some((i) => i.decision === "未決定")) return "submitted";
  const allApproved = items.every((i) => i.decision === "承認");
  if (allApproved) return "approved";
  const allRejected = items.every((i) => i.decision === "却下");
  if (allRejected) return "rejected";
  return "partially_approved";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToItem(row: any): RequestItemRecord {
  return {
    id: row.id,
    requestId: row.request_id,
    orderIndex: row.order_index,
    productName: row.product_name,
    makerCode: row.maker_code,
    productCode: row.product_code,
    deliveryPrice: row.delivery_price,
    standardWholesalePrice: row.standard_wholesale_price,
    desiredWholesalePrice: row.desired_wholesale_price,
    monthlyAvgSales: row.monthly_avg_sales,
    existingSpecialPriceFlag: !!row.existing_special_price_flag,
    deliveryStartDate: row.delivery_start_date,
    registerSpecialPrice: row.register_special_price,
    endDate: row.end_date,
    productAbbreviation: row.product_abbreviation,
    decision: row.decision,
    decidedWholesalePrice: row.decided_wholesale_price,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRequest(row: any, items: RequestItemRecord[]): RequestRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicationDate: row.application_date,
    branchName: row.branch_name,
    branchCode: row.branch_code,
    supervisorName: row.supervisor_name,
    staffName: row.staff_name,
    employeeNumber: row.employee_number,
    customerFacilityName: row.customer_facility_name,
    deliveryDepartment: row.delivery_department,
    customerCodes: row.customer_codes ? JSON.parse(row.customer_codes) : [],
    competitorMakerName: row.competitor_maker_name,
    competitorProductName: row.competitor_product_name,
    competitorProductCode: row.competitor_product_code,
    competitorJanCode: row.competitor_jan_code,
    competitorPurchasePrice: row.competitor_purchase_price,
    competitorDeliveryPrice: row.competitor_delivery_price,
    competitorVendor: row.competitor_vendor,
    reasonType: row.reason_type,
    specialNotes: row.special_notes,
    planningRemarks: row.planning_remarks,
    status: row.status,
    items,
  };
}

export function createRequest(input: RequestInput): string {
  const id = randomUUID();
  const now = new Date().toISOString();

  const insertRequest = db.prepare(`
    INSERT INTO requests (
      id, created_at, updated_at, application_date, branch_name, branch_code,
      supervisor_name, staff_name, employee_number, customer_facility_name,
      delivery_department, customer_codes, competitor_maker_name,
      competitor_product_name, competitor_product_code, competitor_jan_code,
      competitor_purchase_price, competitor_delivery_price, competitor_vendor,
      reason_type, special_notes, planning_remarks, status
    ) VALUES (
      @id, @created_at, @updated_at, @application_date, @branch_name, @branch_code,
      @supervisor_name, @staff_name, @employee_number, @customer_facility_name,
      @delivery_department, @customer_codes, @competitor_maker_name,
      @competitor_product_name, @competitor_product_code, @competitor_jan_code,
      @competitor_purchase_price, @competitor_delivery_price, @competitor_vendor,
      @reason_type, @special_notes, @planning_remarks, @status
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO request_items (
      id, request_id, order_index, product_name, maker_code, product_code,
      delivery_price, standard_wholesale_price, desired_wholesale_price,
      monthly_avg_sales, existing_special_price_flag, delivery_start_date,
      register_special_price, end_date, product_abbreviation, decision,
      decided_wholesale_price
    ) VALUES (
      @id, @request_id, @order_index, @product_name, @maker_code, @product_code,
      @delivery_price, @standard_wholesale_price, @desired_wholesale_price,
      @monthly_avg_sales, @existing_special_price_flag, @delivery_start_date,
      @register_special_price, @end_date, @product_abbreviation, @decision,
      @decided_wholesale_price
    )
  `);

  const tx = db.transaction(() => {
    insertRequest.run({
      id,
      created_at: now,
      updated_at: now,
      application_date: input.applicationDate || null,
      branch_name: input.branchName || null,
      branch_code: input.branchCode || null,
      supervisor_name: input.supervisorName || null,
      staff_name: input.staffName || null,
      employee_number: input.employeeNumber || null,
      customer_facility_name: input.customerFacilityName || null,
      delivery_department: input.deliveryDepartment || null,
      customer_codes: JSON.stringify(
        input.customerCodes.filter((c) => c.trim() !== "")
      ),
      competitor_maker_name: input.competitorMakerName || null,
      competitor_product_name: input.competitorProductName || null,
      competitor_product_code: input.competitorProductCode || null,
      competitor_jan_code: input.competitorJanCode || null,
      competitor_purchase_price: input.competitorPurchasePrice || null,
      competitor_delivery_price: input.competitorDeliveryPrice || null,
      competitor_vendor: input.competitorVendor || null,
      reason_type: input.reasonType || null,
      special_notes: input.specialNotes || null,
      planning_remarks: null,
      status: "submitted",
    });

    input.items.forEach((item, index) => {
      insertItem.run({
        id: randomUUID(),
        request_id: id,
        order_index: index,
        product_name: item.productName || null,
        maker_code: item.makerCode || null,
        product_code: item.productCode || null,
        delivery_price: toNumber(item.deliveryPrice),
        standard_wholesale_price: toNumber(item.standardWholesalePrice),
        desired_wholesale_price: toNumber(item.desiredWholesalePrice),
        monthly_avg_sales: item.monthlyAvgSales || null,
        existing_special_price_flag: item.existingSpecialPriceFlag ? 1 : 0,
        delivery_start_date: item.deliveryStartDate || null,
        register_special_price: item.registerSpecialPrice || null,
        end_date: item.endDate || null,
        product_abbreviation: item.productAbbreviation || null,
        decision: "未決定",
        decided_wholesale_price: null,
      });
    });
  });

  tx();

  return id;
}

export function listRequests(): RequestRecord[] {
  const requestRows = db
    .prepare(`SELECT * FROM requests ORDER BY created_at DESC`)
    .all();
  const itemStmt = db.prepare(
    `SELECT * FROM request_items WHERE request_id = ? ORDER BY order_index ASC`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (requestRows as any[]).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (itemStmt.all(row.id) as any[]).map(rowToItem);
    return rowToRequest(row, items);
  });
}

export function getRequestById(id: string): RequestRecord | null {
  const row = db.prepare(`SELECT * FROM requests WHERE id = ?`).get(id) as
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any;
  if (!row) return null;
  const items = (
    db
      .prepare(
        `SELECT * FROM request_items WHERE request_id = ? ORDER BY order_index ASC`
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .all(id) as any[]
  ).map(rowToItem);
  return rowToRequest(row, items);
}

export function updateItemDecision(
  itemId: string,
  decision: ItemDecision,
  decidedWholesalePrice: string | null
): void {
  const item = db
    .prepare(`SELECT request_id FROM request_items WHERE id = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(itemId) as any;
  if (!item) throw new Error("商品明細が見つかりません");

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE request_items SET decision = ?, decided_wholesale_price = ? WHERE id = ?`
    ).run(decision, toNumber(decidedWholesalePrice), itemId);

    const items = db
      .prepare(`SELECT decision FROM request_items WHERE request_id = ?`)
      .all(item.request_id) as { decision: ItemDecision }[];
    const status = computeStatus(items);
    db.prepare(
      `UPDATE requests SET status = ?, updated_at = ? WHERE id = ?`
    ).run(status, new Date().toISOString(), item.request_id);
  });

  tx();
}

export function updatePlanningRemarks(id: string, remarks: string): void {
  db.prepare(
    `UPDATE requests SET planning_remarks = ?, updated_at = ? WHERE id = ?`
  ).run(remarks, new Date().toISOString(), id);
}

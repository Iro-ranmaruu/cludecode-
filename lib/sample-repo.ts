import { randomUUID } from "crypto";
import db from "@/lib/db";
import type {
  SampleItemRecord,
  SampleRequestInput,
  SampleRequestRecord,
  SampleStatus,
} from "@/lib/sample-types";

function toNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToItem(row: any): SampleItemRecord {
  return {
    id: row.id,
    requestId: row.sample_request_id,
    orderIndex: row.order_index,
    sampleManagementNo: row.sample_management_no,
    makerCode: row.maker_code,
    productCode: row.product_code,
    productName: row.product_name,
    packingUnit: row.packing_unit,
    requestQuantity: row.request_quantity,
    requestUnit: row.request_unit,
    customerCode: row.customer_code,
    customerName: row.customer_name,
    plannedPrice: row.planned_price,
    plannedQuantity: row.planned_quantity,
    plannedDate: row.planned_date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRequest(row: any, items: SampleItemRecord[]): SampleRequestRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    requestNo: row.request_no,
    requestDate: row.request_date,
    destination: row.destination,
    requesterEmployeeNumber: row.requester_employee_number,
    requesterName: row.requester_name,
    requesterDepartment: row.requester_department,
    responsibleCode: row.responsible_code,
    responsibleName: row.responsible_name,
    purpose: row.purpose,
    purposeOtherText: row.purpose_other_text,
    currentVendor: row.current_vendor,
    currentProduct: row.current_product,
    notes: row.notes,
    planningComment: row.planning_comment,
    logisticsComment: row.logistics_comment,
    reviewDate: row.review_date,
    planningProcessedDate: row.planning_processed_date,
    logisticsProcessedDate: row.logistics_processed_date,
    status: row.status,
    items,
  };
}

function nextRequestNo(): string {
  const row = db
    .prepare(`SELECT COUNT(*) AS cnt FROM sample_requests`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get() as any;
  const n = (row?.cnt || 0) + 1;
  return `S${String(n).padStart(6, "0")}`;
}

export function createSampleRequest(input: SampleRequestInput): string {
  const id = randomUUID();
  const now = new Date().toISOString();
  const requestNo = nextRequestNo();

  const insertRequest = db.prepare(`
    INSERT INTO sample_requests (
      id, created_at, updated_at, created_by, request_no, request_date, destination,
      requester_employee_number, requester_name, requester_department,
      responsible_code, responsible_name, purpose, purpose_other_text,
      current_vendor, current_product, notes, planning_comment, logistics_comment,
      review_date, planning_processed_date, logistics_processed_date, status
    ) VALUES (
      @id, @created_at, @updated_at, @created_by, @request_no, @request_date, @destination,
      @requester_employee_number, @requester_name, @requester_department,
      @responsible_code, @responsible_name, @purpose, @purpose_other_text,
      @current_vendor, @current_product, @notes, @planning_comment, @logistics_comment,
      @review_date, @planning_processed_date, @logistics_processed_date, @status
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO sample_request_items (
      id, sample_request_id, order_index, sample_management_no, maker_code, product_code,
      product_name, packing_unit, request_quantity, request_unit, customer_code,
      customer_name, planned_price, planned_quantity, planned_date
    ) VALUES (
      @id, @sample_request_id, @order_index, @sample_management_no, @maker_code, @product_code,
      @product_name, @packing_unit, @request_quantity, @request_unit, @customer_code,
      @customer_name, @planned_price, @planned_quantity, @planned_date
    )
  `);

  const tx = db.transaction(() => {
    insertRequest.run({
      id,
      created_at: now,
      updated_at: now,
      created_by: input.createdBy || null,
      request_no: requestNo,
      request_date: input.requestDate || null,
      destination: input.destination || null,
      requester_employee_number: input.requesterEmployeeNumber || null,
      requester_name: input.requesterName || null,
      requester_department: input.requesterDepartment || null,
      responsible_code: input.responsibleCode || null,
      responsible_name: input.responsibleName || null,
      purpose: input.purpose || null,
      purpose_other_text: input.purposeOtherText || null,
      current_vendor: input.currentVendor || null,
      current_product: input.currentProduct || null,
      notes: input.notes || null,
      planning_comment: null,
      logistics_comment: null,
      review_date: null,
      planning_processed_date: null,
      logistics_processed_date: null,
      status: "submitted",
    });

    input.items.forEach((item, index) => {
      insertItem.run({
        id: randomUUID(),
        sample_request_id: id,
        order_index: index,
        sample_management_no: item.sampleManagementNo || null,
        maker_code: item.makerCode || null,
        product_code: item.productCode || null,
        product_name: item.productName || null,
        packing_unit: item.packingUnit || null,
        request_quantity: item.requestQuantity || null,
        request_unit: item.requestUnit || null,
        customer_code: item.customerCode || null,
        customer_name: item.customerName || null,
        planned_price: toNumber(item.plannedPrice),
        planned_quantity: item.plannedQuantity || null,
        planned_date: item.plannedDate || null,
      });
    });
  });

  tx();
  return id;
}

export function listSampleRequests(): SampleRequestRecord[] {
  const requestRows = db
    .prepare(`SELECT * FROM sample_requests ORDER BY created_at DESC`)
    .all();
  const itemStmt = db.prepare(
    `SELECT * FROM sample_request_items WHERE sample_request_id = ? ORDER BY order_index ASC`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (requestRows as any[]).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (itemStmt.all(row.id) as any[]).map(rowToItem);
    return rowToRequest(row, items);
  });
}

export function getSampleRequestById(id: string): SampleRequestRecord | null {
  const row = db
    .prepare(`SELECT * FROM sample_requests WHERE id = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(id) as any;
  if (!row) return null;
  const items = (
    db
      .prepare(
        `SELECT * FROM sample_request_items WHERE sample_request_id = ? ORDER BY order_index ASC`
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .all(id) as any[]
  ).map(rowToItem);
  return rowToRequest(row, items);
}

export function updateSampleRequestProcessing(
  id: string,
  fields: {
    status: SampleStatus;
    planningComment: string;
    logisticsComment: string;
    reviewDate: string;
    planningProcessedDate: string;
    logisticsProcessedDate: string;
  }
): void {
  db.prepare(
    `UPDATE sample_requests SET
       status = @status,
       planning_comment = @planning_comment,
       logistics_comment = @logistics_comment,
       review_date = @review_date,
       planning_processed_date = @planning_processed_date,
       logistics_processed_date = @logistics_processed_date,
       updated_at = @updated_at
     WHERE id = @id`
  ).run({
    id,
    status: fields.status,
    planning_comment: fields.planningComment || null,
    logistics_comment: fields.logisticsComment || null,
    review_date: fields.reviewDate || null,
    planning_processed_date: fields.planningProcessedDate || null,
    logistics_processed_date: fields.logisticsProcessedDate || null,
    updated_at: new Date().toISOString(),
  });
}

import { randomUUID } from "crypto";
import db from "@/lib/db";
import type {
  DefectItemRecord,
  DefectRequestInput,
  DefectRequestRecord,
  DefectStatus,
} from "@/lib/defect-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToItem(row: any): DefectItemRecord {
  return {
    id: row.id,
    requestId: row.defect_request_id,
    orderIndex: row.order_index,
    makerCode: row.maker_code,
    productCode: row.product_code,
    productName: row.product_name,
    packingUnit: row.packing_unit,
    quantity: row.quantity,
    lotNo: row.lot_no,
    defectCategory: row.defect_category,
    defectDetail: row.defect_detail,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRequest(row: any, items: DefectItemRecord[]): DefectRequestRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    requestDate: row.request_date,
    branchName: row.branch_name,
    branchCode: row.branch_code,
    supervisorName: row.supervisor_name,
    staffName: row.staff_name,
    employeeNumber: row.employee_number,
    customerFacilityName: row.customer_facility_name,
    customerCode: row.customer_code,
    department: row.department,
    contactPerson: row.contact_person,
    sendDestination: row.send_destination,
    sendDestinationNotes: row.send_destination_notes,
    needsWrittenResponse: !!row.needs_written_response,
    needsReplacement: !!row.needs_replacement,
    replacementQuantity: row.replacement_quantity,
    replacementUnit: row.replacement_unit,
    otherNotes: row.other_notes,
    planningComment: row.planning_comment,
    status: row.status,
    items,
  };
}

export function createDefectRequest(input: DefectRequestInput): string {
  const id = randomUUID();
  const now = new Date().toISOString();

  const insertRequest = db.prepare(`
    INSERT INTO defect_requests (
      id, created_at, updated_at, created_by, request_date, branch_name, branch_code,
      supervisor_name, staff_name, employee_number, customer_facility_name,
      customer_code, department, contact_person, send_destination, send_destination_notes,
      needs_written_response, needs_replacement, replacement_quantity, replacement_unit,
      other_notes, planning_comment, status
    ) VALUES (
      @id, @created_at, @updated_at, @created_by, @request_date, @branch_name, @branch_code,
      @supervisor_name, @staff_name, @employee_number, @customer_facility_name,
      @customer_code, @department, @contact_person, @send_destination, @send_destination_notes,
      @needs_written_response, @needs_replacement, @replacement_quantity, @replacement_unit,
      @other_notes, @planning_comment, @status
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO defect_request_items (
      id, defect_request_id, order_index, maker_code, product_code, product_name,
      packing_unit, quantity, lot_no, defect_category, defect_detail
    ) VALUES (
      @id, @defect_request_id, @order_index, @maker_code, @product_code, @product_name,
      @packing_unit, @quantity, @lot_no, @defect_category, @defect_detail
    )
  `);

  const tx = db.transaction(() => {
    insertRequest.run({
      id,
      created_at: now,
      updated_at: now,
      created_by: input.createdBy || null,
      request_date: input.requestDate || null,
      branch_name: input.branchName || null,
      branch_code: input.branchCode || null,
      supervisor_name: input.supervisorName || null,
      staff_name: input.staffName || null,
      employee_number: input.employeeNumber || null,
      customer_facility_name: input.customerFacilityName || null,
      customer_code: input.customerCode || null,
      department: input.department || null,
      contact_person: input.contactPerson || null,
      send_destination: input.sendDestination || null,
      send_destination_notes: input.sendDestinationNotes || null,
      needs_written_response: input.needsWrittenResponse ? 1 : 0,
      needs_replacement: input.needsReplacement ? 1 : 0,
      replacement_quantity: input.replacementQuantity || null,
      replacement_unit: input.replacementUnit || null,
      other_notes: input.otherNotes || null,
      planning_comment: null,
      status: "submitted",
    });

    input.items.forEach((item, index) => {
      insertItem.run({
        id: randomUUID(),
        defect_request_id: id,
        order_index: index,
        maker_code: item.makerCode || null,
        product_code: item.productCode || null,
        product_name: item.productName || null,
        packing_unit: item.packingUnit || null,
        quantity: item.quantity || null,
        lot_no: item.lotNo || null,
        defect_category: item.defectCategory || null,
        defect_detail: item.defectDetail || null,
      });
    });
  });

  tx();
  return id;
}

export function listDefectRequests(): DefectRequestRecord[] {
  const requestRows = db
    .prepare(`SELECT * FROM defect_requests ORDER BY created_at DESC`)
    .all();
  const itemStmt = db.prepare(
    `SELECT * FROM defect_request_items WHERE defect_request_id = ? ORDER BY order_index ASC`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (requestRows as any[]).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (itemStmt.all(row.id) as any[]).map(rowToItem);
    return rowToRequest(row, items);
  });
}

export function getDefectRequestById(id: string): DefectRequestRecord | null {
  const row = db
    .prepare(`SELECT * FROM defect_requests WHERE id = ?`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .get(id) as any;
  if (!row) return null;
  const items = (
    db
      .prepare(
        `SELECT * FROM defect_request_items WHERE defect_request_id = ? ORDER BY order_index ASC`
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .all(id) as any[]
  ).map(rowToItem);
  return rowToRequest(row, items);
}

export function updateDefectRequestStatus(
  id: string,
  status: DefectStatus,
  planningComment: string
): void {
  db.prepare(
    `UPDATE defect_requests SET status = ?, planning_comment = ?, updated_at = ? WHERE id = ?`
  ).run(status, planningComment, new Date().toISOString(), id);
}

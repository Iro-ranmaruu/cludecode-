"use client";

import { useId, useRef, useState } from "react";
import { submitDefectRequestAction } from "@/lib/defect-actions";
import { fetchProductInfo } from "@/lib/product-lookup-client";
import { fetchEmployeeInfo } from "@/lib/employee-lookup-client";
import { fetchCustomerInfo } from "@/lib/customer-lookup-client";
import { DEFECT_CATEGORY_OPTIONS, SEND_DESTINATION_OPTIONS } from "@/lib/defect-types";
import {
  RequiredProgressBar,
  ValidationErrorBanner,
  useRequiredProgress,
  validateAndHighlight,
} from "@/components/FormProgress";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";
const UNIT_OPTIONS = ["個", "枚", "本", "巻", "箱", "双", "ケース"];

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

interface DefectFormProps {
  currentUser?: {
    name: string;
    employeeNumber: string;
    branchName: string | null;
  } | null;
}

export default function DefectForm({ currentUser }: DefectFormProps) {
  const uid = useId();
  const [itemIds, setItemIds] = useState<string[]>([`${uid}-0`]);
  const [needsReplacement, setNeedsReplacement] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const progress = useRequiredProgress(formRef);
  const [showValidationBanner, setShowValidationBanner] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const ok = validateAndHighlight(e.currentTarget);
    setShowValidationBanner(!ok);
    if (!ok) e.preventDefault();
  }

  async function handleProductLookupBlur(e: React.FocusEvent<HTMLInputElement>) {
    const row = e.currentTarget.closest("[data-item-row]");
    if (!row) return;
    const makerInput = row.querySelector<HTMLInputElement>('[data-field="makerCode"]');
    const productInput = row.querySelector<HTMLInputElement>('[data-field="productCode"]');
    const nameInput = row.querySelector<HTMLInputElement>('[data-field="productName"]');
    const unitInput = row.querySelector<HTMLInputElement>('[data-field="packingUnit"]');
    if (!makerInput || !productInput || !nameInput) return;

    const result = await fetchProductInfo(makerInput.value, productInput.value);
    if (result) {
      nameInput.value = result.productName;
      if (unitInput) unitInput.value = result.packingUnit;
    }
  }

  async function handleEmployeeLookupBlur(e: React.FocusEvent<HTMLInputElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    const staffNameInput = form.querySelector<HTMLInputElement>('[name="staffName"]');
    const branchNameInput = form.querySelector<HTMLInputElement>('[name="branchName"]');
    const branchCodeInput = form.querySelector<HTMLInputElement>('[name="branchCode"]');
    const supervisorInput = form.querySelector<HTMLInputElement>('[name="supervisorName"]');
    const result = await fetchEmployeeInfo(e.currentTarget.value);
    if (!result) return;
    if (staffNameInput) staffNameInput.value = result.name;
    if (branchNameInput) branchNameInput.value = result.branchName;
    if (branchCodeInput) branchCodeInput.value = result.branchCode;
    if (supervisorInput) supervisorInput.value = result.supervisorName;
  }

  async function handleCustomerCodeLookupBlur(e: React.FocusEvent<HTMLInputElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    const facilityNameInput = form.querySelector<HTMLInputElement>('[name="customerFacilityName"]');
    const result = await fetchCustomerInfo(e.currentTarget.value);
    if (!result || !facilityNameInput) return;
    facilityNameInput.value = result.customerName;
  }

  return (
    <form
      ref={formRef}
      action={submitDefectRequestAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      <input type="hidden" name="itemCount" value={itemIds.length} />

      <RequiredProgressBar filled={progress.filled} total={progress.total} />
      <ValidationErrorBanner show={showValidationBanner} />

      <Section title="依頼者情報">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="依頼日" required>
            <input
              type="date"
              name="requestDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputCls}
            />
          </Field>
          <Field label="店所名" required>
            <input
              name="branchName"
              required
              defaultValue={currentUser?.branchName || ""}
              className={inputCls}
            />
          </Field>
          <Field label="店所コード">
            <input name="branchCode" className={inputCls} />
          </Field>
          <Field label="所属長名">
            <input name="supervisorName" className={inputCls} />
          </Field>
          <Field label="担当者名" required>
            <input
              name="staffName"
              required
              defaultValue={currentUser?.name || ""}
              className={inputCls}
            />
          </Field>
          <Field label="社員番号">
            <input
              name="employeeNumber"
              defaultValue={currentUser?.employeeNumber || ""}
              onBlur={handleEmployeeLookupBlur}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section title="得意先情報">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="得意先施設名" required>
            <input name="customerFacilityName" required className={inputCls} />
          </Field>
          <Field label="得意先コード">
            <input
              name="customerCode"
              placeholder="例: IK919100"
              onBlur={handleCustomerCodeLookupBlur}
              className={inputCls}
            />
          </Field>
          <Field label="部署">
            <input name="department" className={inputCls} />
          </Field>
          <Field label="ご担当者名">
            <input name="contactPerson" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section
        title="商品明細・不具合内容"
        description="不具合のあった商品を1行ずつ入力してください。行は自由に追加・削除できます。"
      >
        <div className="space-y-4">
          {itemIds.map((id, i) => (
            <div key={id} data-item-row className="rounded-md border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">商品 {i + 1}</span>
                {itemIds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItemIds((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-rose-600 hover:text-rose-800"
                  >
                    この行を削除
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="メーカーコード">
                  <input
                    name={`items[${i}][makerCode]`}
                    data-field="makerCode"
                    onBlur={handleProductLookupBlur}
                    className={inputCls}
                  />
                </Field>
                <Field label="商品コード">
                  <input
                    name={`items[${i}][productCode]`}
                    data-field="productCode"
                    onBlur={handleProductLookupBlur}
                    className={inputCls}
                  />
                </Field>
                <Field label="商品名" required>
                  <input
                    name={`items[${i}][productName]`}
                    data-field="productName"
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label="梱包単位">
                  <input
                    name={`items[${i}][packingUnit]`}
                    data-field="packingUnit"
                    className={inputCls}
                  />
                </Field>
                <Field label="数量">
                  <input name={`items[${i}][quantity]`} className={inputCls} />
                </Field>
                <Field label="ロットNO.">
                  <input name={`items[${i}][lotNo]`} className={inputCls} />
                </Field>
                <Field label="不具合内容">
                  <select
                    name={`items[${i}][defectCategory]`}
                    defaultValue=""
                    className={inputCls}
                  >
                    <option value="" disabled>
                      選択してください
                    </option>
                    {DEFECT_CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="不具合内容詳細">
                  <textarea
                    name={`items[${i}][defectDetail]`}
                    rows={2}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setItemIds((prev) => [...prev, `${uid}-${prev.length}-${Date.now()}`])
          }
          className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          + 商品行を追加
        </button>
      </Section>

      <Section title="不具合品送付先">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SEND_DESTINATION_OPTIONS.map((opt, i) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="sendDestination"
                value={opt}
                defaultChecked={i === 0}
              />
              {opt}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Field label="不具合品についての特記事項">
            <textarea name="sendDestinationNotes" rows={2} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="依頼内容">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="needsWrittenResponse" />
            ① メーカーから文書による回答が必要
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="needsReplacement"
              checked={needsReplacement}
              onChange={(e) => setNeedsReplacement(e.target.checked)}
            />
            ② 代替品が必要
          </label>
          {needsReplacement && (
            <div className="ml-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="数量">
                <input name="replacementQuantity" className={inputCls} />
              </Field>
              <Field label="単位">
                <select name="replacementUnit" defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    選択してください
                  </option>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      </Section>

      <Section title="その他">
        <textarea name="otherNotes" rows={3} className={inputCls} />
      </Section>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          企画へ依頼する
        </button>
      </div>
    </form>
  );
}

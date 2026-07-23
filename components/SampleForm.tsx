"use client";

import { useId, useState } from "react";
import { submitSampleRequestAction } from "@/lib/sample-actions";
import { fetchProductInfo } from "@/lib/product-lookup-client";
import { DESTINATION_OPTIONS, PURPOSE_OPTIONS } from "@/lib/sample-types";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

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

interface SampleFormProps {
  currentUser?: {
    name: string;
    employeeNumber: string;
    branchName: string | null;
  } | null;
}

export default function SampleForm({ currentUser }: SampleFormProps) {
  const uid = useId();
  const [itemIds, setItemIds] = useState<string[]>([`${uid}-0`]);
  const [purpose, setPurpose] = useState("切替提案");

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

  return (
    <form action={submitSampleRequestAction} className="space-y-6">
      <input type="hidden" name="itemCount" value={itemIds.length} />

      <Section title="申請情報">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="申請日" required>
            <input
              type="date"
              name="requestDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <label className={labelCls}>申請先</label>
            <div className="flex flex-wrap gap-4 pt-1.5">
              {DESTINATION_OPTIONS.map((d, i) => (
                <label key={d} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input type="radio" name="destination" value={d} defaultChecked={i === 0} />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="申請者・責任者">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="社員番号">
            <input
              name="requesterEmployeeNumber"
              defaultValue={currentUser?.employeeNumber || ""}
              className={inputCls}
            />
          </Field>
          <Field label="氏名" required>
            <input
              name="requesterName"
              required
              defaultValue={currentUser?.name || ""}
              className={inputCls}
            />
          </Field>
          <Field label="部署">
            <input
              name="requesterDepartment"
              defaultValue={currentUser?.branchName || ""}
              className={inputCls}
            />
          </Field>
          <Field label="責任者コード">
            <input name="responsibleCode" className={inputCls} />
          </Field>
          <Field label="責任者名">
            <input name="responsibleName" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="目的・現況">
        <div>
          <label className={labelCls}>目的</label>
          <div className="flex flex-wrap gap-4 pt-1.5">
            {PURPOSE_OPTIONS.map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="radio"
                  name="purpose"
                  value={p}
                  checked={purpose === p}
                  onChange={() => setPurpose(p)}
                />
                {p}
              </label>
            ))}
          </div>
          {purpose === "その他" && (
            <input
              name="purposeOtherText"
              placeholder="目的（その他）"
              className={`${inputCls} mt-2`}
            />
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="現在納入業者">
            <input name="currentVendor" className={inputCls} />
          </Field>
          <Field label="現在納入商品【他社競合品名】">
            <input name="currentProduct" className={inputCls} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="特記事項">
            <textarea name="notes" rows={2} className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section
        title="サンプル明細"
        description="依頼するサンプルを1行ずつ入力してください。行は自由に追加・削除できます。"
      >
        <div className="space-y-4">
          {itemIds.map((id, i) => (
            <div key={id} data-item-row className="rounded-md border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">明細 {i + 1}</span>
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
                <Field label="サンプル管理番号">
                  <input name={`items[${i}][sampleManagementNo]`} className={inputCls} />
                </Field>
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
                <Field label="依頼数量">
                  <input name={`items[${i}][requestQuantity]`} className={inputCls} />
                </Field>
                <Field label="依頼単位">
                  <input name={`items[${i}][requestUnit]`} className={inputCls} />
                </Field>
                <Field label="得意先コード">
                  <input name={`items[${i}][customerCode]`} className={inputCls} />
                </Field>
                <Field label="得意先名">
                  <input name={`items[${i}][customerName]`} className={inputCls} />
                </Field>
                <Field label="納入予定価格">
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][plannedPrice]`}
                    className={inputCls}
                  />
                </Field>
                <Field label="納入予定数量">
                  <input name={`items[${i}][plannedQuantity]`} className={inputCls} />
                </Field>
                <Field label="納入予定日">
                  <input
                    type="date"
                    name={`items[${i}][plannedDate]`}
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
          + 明細を追加
        </button>
      </Section>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          企画へ申請する
        </button>
      </div>
    </form>
  );
}

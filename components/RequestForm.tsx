"use client";

import { useId, useRef, useState } from "react";
import { submitRequestAction } from "@/lib/actions";
import { fetchProductInfo } from "@/lib/product-lookup-client";
import {
  RequiredProgressBar,
  ValidationErrorBanner,
  useRequiredProgress,
  validateAndHighlight,
} from "@/components/FormProgress";

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
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

interface RequestFormProps {
  currentUser?: {
    name: string;
    employeeNumber: string;
    branchName: string | null;
  } | null;
}

export default function RequestForm({ currentUser }: RequestFormProps) {
  const uid = useId();
  const [itemIds, setItemIds] = useState<string[]>([`${uid}-0`]);
  const [customerCodeIds, setCustomerCodeIds] = useState<string[]>([
    `${uid}-c0`,
  ]);
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
    const standardPriceInput = row.querySelector<HTMLInputElement>(
      '[data-field="standardWholesalePrice"]'
    );
    const guidelinePriceInput = row.querySelector<HTMLInputElement>(
      '[data-field="guidelinePrice"]'
    );
    const guidelineDisplay = row.querySelector<HTMLElement>('[data-guideline-display]');
    if (!makerInput || !productInput || !nameInput) return;

    const result = await fetchProductInfo(makerInput.value, productInput.value);
    if (result) {
      nameInput.value = result.productName;
      if (unitInput) unitInput.value = result.packingUnit;
      if (standardPriceInput && result.standardWholesalePrice !== null) {
        standardPriceInput.value = String(result.standardWholesalePrice);
      }
      if (guidelinePriceInput) {
        guidelinePriceInput.value =
          result.guidelinePrice !== null ? String(result.guidelinePrice) : "";
      }
      if (guidelineDisplay) {
        guidelineDisplay.textContent =
          result.guidelinePrice !== null
            ? `特価目安: ¥${result.guidelinePrice.toLocaleString("ja-JP")}`
            : "特価目安: -";
      }
    }
  }

  return (
    <form
      ref={formRef}
      action={submitRequestAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      <input type="hidden" name="itemCount" value={itemIds.length} />

      <RequiredProgressBar filled={progress.filled} total={progress.total} />
      <ValidationErrorBanner show={showValidationBanner} />

      <Section title="申請者情報">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="申請日" required>
            <input
              type="date"
              name="applicationDate"
              required
              className={inputCls}
              defaultValue={new Date().toISOString().slice(0, 10)}
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
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section title="得意先情報">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="得意先施設名" required>
            <input name="customerFacilityName" required className={inputCls} />
          </Field>
          <Field label="施設内の納入部所">
            <input name="deliveryDepartment" className={inputCls} />
          </Field>
        </div>

        <div className="mt-4">
          <label className={labelCls}>得意先コード（先頭6桁）</label>
          <p className="mb-2 text-xs text-slate-500">
            半角英数字6桁で入力してください。末尾2桁には自動で「00」が付きます。
          </p>
          <div className="space-y-2">
            {customerCodeIds.map((id, i) => (
              <div key={id} className="flex items-center gap-2">
                <input
                  name="customerCodes[]"
                  maxLength={6}
                  pattern="[0-9A-Za-z]{6}"
                  title="半角英数字6桁で入力してください"
                  placeholder="例: JI7000"
                  style={{ textTransform: "uppercase" }}
                  className={`${inputCls} max-w-[140px]`}
                />
                <span className="text-sm text-slate-400">+ 00</span>
                {customerCodeIds.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCustomerCodeIds((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    className="shrink-0 rounded-md border border-slate-300 px-2 text-xs text-slate-500 hover:bg-slate-50"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setCustomerCodeIds((prev) => [...prev, `${uid}-c${prev.length}-${Date.now()}`])
            }
            className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            + 得意先コードを追加
          </button>
        </div>
      </Section>

      <Section
        title="商品明細"
        description="申請する商品を1行ずつ入力してください。行は自由に追加・削除できます。"
      >
        <div className="space-y-4">
          {itemIds.map((id, i) => (
            <div
              key={id}
              data-item-row
              className="rounded-md border border-slate-200 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  商品 {i + 1}
                </span>
                {itemIds.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setItemIds((prev) => prev.filter((_, idx) => idx !== i))
                    }
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
                <Field label="商品略称">
                  <input
                    name={`items[${i}][productAbbreviation]`}
                    className={inputCls}
                  />
                </Field>
                <Field label="納入価">
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][deliveryPrice]`}
                    className={inputCls}
                  />
                </Field>
                <Field label="通常仕切（営業仕切）" required>
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][standardWholesalePrice]`}
                    data-field="standardWholesalePrice"
                    required
                    className={inputCls}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    メーカーコード・商品コードから商品マスタを参照して自動入力されます（手動で修正可）
                  </p>
                </Field>
                <Field label="希望仕切額" required>
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][desiredWholesalePrice]`}
                    required
                    className={inputCls}
                  />
                  <p data-guideline-display className="mt-1 text-xs text-sky-600">
                    特価目安: -
                  </p>
                  <input
                    type="hidden"
                    name={`items[${i}][guidelinePrice]`}
                    data-field="guidelinePrice"
                  />
                </Field>
                <Field label="月平均販売量">
                  <input
                    name={`items[${i}][monthlyAvgSales]`}
                    placeholder="例: 10ケース"
                    className={inputCls}
                  />
                </Field>
                <Field label="納入開始日">
                  <input
                    type="date"
                    name={`items[${i}][deliveryStartDate]`}
                    className={inputCls}
                  />
                </Field>
                <Field label="終了日">
                  <input
                    type="date"
                    name={`items[${i}][endDate]`}
                    className={inputCls}
                  />
                </Field>
                <Field label="特価登録もする？">
                  <select
                    name={`items[${i}][registerSpecialPrice]`}
                    defaultValue="登録する"
                    className={inputCls}
                  >
                    <option value="登録する">登録する</option>
                    <option value="申請のみ">申請のみ</option>
                  </select>
                </Field>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      name={`items[${i}][existingSpecialPriceFlag]`}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    同商品同得意先で特価登録済み
                  </label>
                </div>
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

      <Section title="既納入品・競合提示製品情報（任意）">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="メーカー名">
            <input name="competitorMakerName" className={inputCls} />
          </Field>
          <Field label="商品名">
            <input name="competitorProductName" className={inputCls} />
          </Field>
          <Field label="商品コード">
            <input name="competitorProductCode" className={inputCls} />
          </Field>
          <Field label="JANコード">
            <input name="competitorJanCode" className={inputCls} />
          </Field>
          <Field label="仕入価格">
            <input name="competitorPurchasePrice" className={inputCls} />
          </Field>
          <Field label="納入価">
            <input name="competitorDeliveryPrice" className={inputCls} />
          </Field>
          <Field label="納入業者">
            <input name="competitorVendor" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="特価申請理由・特記事項">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="特価申請理由" required>
            <select name="reasonType" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                選択してください
              </option>
              <option value="新規">1. 新規</option>
              <option value="防衛">2. 防衛</option>
              <option value="自社既納入品の変更">
                3. 自社既納入品の変更
              </option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="その他特記事項（事前承認がある場合もこちらへ記入）">
            <textarea
              name="specialNotes"
              rows={3}
              className={inputCls}
            />
          </Field>
        </div>
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

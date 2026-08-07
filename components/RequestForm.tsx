"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitRequestAction } from "@/lib/actions";
import { fetchProductInfo } from "@/lib/product-lookup-client";
import { fetchEmployeeInfo } from "@/lib/employee-lookup-client";
import { fetchCustomerInfo } from "@/lib/customer-lookup-client";
import type { ProductSearchResult } from "@/lib/product-search-client";
import ProductNameSearch from "@/components/ProductNameSearch";
import {
  RequiredProgressBar,
  ValidationErrorBanner,
  useRequiredProgress,
  validateAndHighlight,
} from "@/components/FormProgress";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const autoFilledCls =
  "w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-500 shadow-sm cursor-not-allowed";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";
const MARGIN_WARNING_THRESHOLD = 0.15;

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
  const router = useRouter();
  const [itemIds, setItemIds] = useState<string[]>([`${uid}-0`]);
  const [customerCodeIds, setCustomerCodeIds] = useState<string[]>([
    `${uid}-c0`,
  ]);
  const formRef = useRef<HTMLFormElement>(null);
  const progress = useRequiredProgress(formRef);
  const [showValidationBanner, setShowValidationBanner] = useState(false);
  const [showMarginWarning, setShowMarginWarning] = useState(false);
  const [showGuidelineWarning, setShowGuidelineWarning] = useState(false);
  const [preApproved, setPreApproved] = useState(false);
  const [customerType, setCustomerType] = useState<"既存" | "新規">("既存");

  function handleCustomerTypeChange(type: "既存" | "新規") {
    setCustomerType(type);
    const form = formRef.current;
    if (!form) return;
    const codeInput = form.querySelector<HTMLInputElement>('input[name="customerCodes[]"]');
    const facilityInput = form.querySelector<HTMLInputElement>('[name="customerFacilityName"]');
    if (type === "新規") {
      if (codeInput) codeInput.value = "TL0000";
      if (facilityInput) facilityInput.value = "";
    } else {
      if (codeInput) codeInput.value = "";
      if (facilityInput) facilityInput.value = "";
    }
  }

  function hasExcessiveMargin(form: HTMLFormElement): boolean {
    const rows = Array.from(form.querySelectorAll<HTMLElement>("[data-item-row]"));
    return rows.some((row) => {
      const deliveryInput = row.querySelector<HTMLInputElement>('[data-field="deliveryPrice"]');
      const standardInput = row.querySelector<HTMLInputElement>(
        '[data-field="standardWholesalePrice"]'
      );
      const delivery = Number(deliveryInput?.value);
      const standard = Number(standardInput?.value);
      if (!delivery || !standard) return false;
      const margin = (delivery - standard) / delivery;
      return margin >= MARGIN_WARNING_THRESHOLD;
    });
  }

  function hasDesiredBelowGuideline(form: HTMLFormElement): boolean {
    const rows = Array.from(form.querySelectorAll<HTMLElement>("[data-item-row]"));
    return rows.some((row) => {
      const desiredInput = row.querySelector<HTMLInputElement>(
        '[data-field="desiredWholesalePrice"]'
      );
      const guidelineInput = row.querySelector<HTMLInputElement>('[data-field="guidelinePrice"]');
      const desired = Number(desiredInput?.value);
      const guideline = Number(guidelineInput?.value);
      if (!desired || !guideline) return false;
      return desired < guideline;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const ok = validateAndHighlight(e.currentTarget);
    setShowValidationBanner(!ok);
    if (!ok) {
      e.preventDefault();
      return;
    }
    if (hasExcessiveMargin(e.currentTarget)) {
      e.preventDefault();
      setShowMarginWarning(true);
      return;
    }
    if (!preApproved && hasDesiredBelowGuideline(e.currentTarget)) {
      e.preventDefault();
      setShowGuidelineWarning(true);
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
    const facilityNameInput = form.querySelector<HTMLInputElement>(
      '[name="customerFacilityName"]'
    );
    const result = await fetchCustomerInfo(e.currentTarget.value);
    if (!result || !facilityNameInput) return;
    facilityNameInput.value = result.customerName;
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
    }
  }

  function handleProductSearchSelect(rowIndex: number, product: ProductSearchResult) {
    const form = formRef.current;
    if (!form) return;
    const rows = form.querySelectorAll<HTMLElement>("[data-item-row]");
    const row = rows[rowIndex];
    if (!row) return;
    const makerInput = row.querySelector<HTMLInputElement>('[data-field="makerCode"]');
    const productInput = row.querySelector<HTMLInputElement>('[data-field="productCode"]');
    const nameInput = row.querySelector<HTMLInputElement>('[data-field="productName"]');
    const unitInput = row.querySelector<HTMLInputElement>('[data-field="packingUnit"]');
    const standardPriceInput = row.querySelector<HTMLInputElement>(
      '[data-field="standardWholesalePrice"]'
    );
    const guidelinePriceInput = row.querySelector<HTMLInputElement>('[data-field="guidelinePrice"]');

    if (makerInput) makerInput.value = product.makerCode;
    if (productInput) productInput.value = product.productCode;
    if (nameInput) nameInput.value = product.productName;
    if (unitInput) unitInput.value = product.packingUnit;
    if (standardPriceInput) {
      standardPriceInput.value =
        product.standardWholesalePrice !== null ? String(product.standardWholesalePrice) : "";
    }
    if (guidelinePriceInput) {
      guidelinePriceInput.value =
        product.guidelinePrice !== null ? String(product.guidelinePrice) : "";
    }
    // Programmatic value changes don't fire native input/change events, so nudge the
    // required-field progress bar (and any lingering validation-error styling) to recompute.
    makerInput?.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <>
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
            />
          </Field>
          <Field label="社員番号" required>
            <input
              name="employeeNumber"
              required
              onBlur={handleEmployeeLookupBlur}
              className={inputCls}
            />
          </Field>
          <Field label="担当者名">
            <input
              name="staffName"
              readOnly
              placeholder="自動入力"
              defaultValue={currentUser?.name || ""}
              className={autoFilledCls}
            />
          </Field>
          <Field label="店所名">
            <input
              name="branchName"
              readOnly
              placeholder="自動入力"
              defaultValue={currentUser?.branchName || ""}
              className={autoFilledCls}
            />
          </Field>
          <Field label="店所コード">
            <input name="branchCode" readOnly placeholder="自動入力" className={autoFilledCls} />
          </Field>
          <Field label="所属長名">
            <input name="supervisorName" readOnly placeholder="自動入力" className={autoFilledCls} />
          </Field>
        </div>
      </Section>

      <Section title="特価申請理由">
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
      </Section>

      <Section title="得意先情報">
        <div className="mb-4 flex gap-5">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="customerType"
              value="新規"
              checked={customerType === "新規"}
              onChange={() => handleCustomerTypeChange("新規")}
              className="h-4 w-4 border-slate-300"
            />
            新規得意先
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name="customerType"
              value="既存"
              checked={customerType === "既存"}
              onChange={() => handleCustomerTypeChange("既存")}
              className="h-4 w-4 border-slate-300"
            />
            既存得意先
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="得意先施設名">
            <input
              name="customerFacilityName"
              readOnly={customerType === "既存"}
              placeholder={customerType === "新規" ? "得意先名称を入力してください" : "自動入力"}
              className={customerType === "既存" ? autoFilledCls : inputCls}
            />
          </Field>
          <Field label="施設内の納入部所">
            <input name="deliveryDepartment" className={inputCls} />
          </Field>
        </div>

        <div className="mt-4">
          <label className={labelCls}>
            得意先コード（先頭6桁）
            <span className="ml-1 text-rose-600">*</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">
            半角英数字6桁で入力してください。末尾2桁には自動で「00」が付きます。
          </p>
          <div className="space-y-2">
            {customerCodeIds.map((id, i) => (
              <div key={id} className="flex items-center gap-2">
                <input
                  name="customerCodes[]"
                  required={i === 0}
                  maxLength={6}
                  pattern="[0-9A-Za-z]{6}"
                  title="半角英数字6桁で入力してください"
                  placeholder={i === 0 && customerType === "新規" ? "TL0000" : "例: JI7000"}
                  readOnly={i === 0 && customerType === "新規"}
                  style={{ textTransform: "uppercase" }}
                  onBlur={handleCustomerCodeLookupBlur}
                  className={
                    i === 0 && customerType === "新規"
                      ? `${autoFilledCls} max-w-[140px]`
                      : `${inputCls} max-w-[140px]`
                  }
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

              <div className="mb-3">
                <Field label="商品名検索">
                  <ProductNameSearch
                    className={inputCls}
                    onSelect={(product) => handleProductSearchSelect(i, product)}
                  />
                </Field>
                <p className="mt-1 text-xs text-slate-400">
                  商品名の一部を入力すると候補が表示されます。選択すると下の項目が自動入力されます。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="メーカーコード" required>
                  <input
                    name={`items[${i}][makerCode]`}
                    data-field="makerCode"
                    required
                    onBlur={handleProductLookupBlur}
                    className={inputCls}
                  />
                </Field>
                <Field label="商品コード" required>
                  <input
                    name={`items[${i}][productCode]`}
                    data-field="productCode"
                    required
                    onBlur={handleProductLookupBlur}
                    className={inputCls}
                  />
                </Field>
                <Field label="商品名">
                  <input
                    name={`items[${i}][productName]`}
                    data-field="productName"
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
                <Field label="納入価" required>
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][deliveryPrice]`}
                    data-field="deliveryPrice"
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label="通常仕切（営業仕切）">
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][standardWholesalePrice]`}
                    data-field="standardWholesalePrice"
                    className={inputCls}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    メーカーコード・商品コードから商品マスタを参照して自動入力されます（手動で修正可）
                  </p>
                </Field>
                <Field label="特価目安">
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][guidelinePrice]`}
                    data-field="guidelinePrice"
                    className={inputCls}
                  />
                </Field>
                <Field label="希望仕切額" required>
                  <input
                    type="number"
                    step="any"
                    name={`items[${i}][desiredWholesalePrice]`}
                    data-field="desiredWholesalePrice"
                    required
                    className={inputCls}
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

      <Section title="特記事項">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="preApprovedByPlanning"
            checked={preApproved}
            onChange={(e) => setPreApproved(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          WiSM企画事前承認済み
        </label>
        {preApproved && (
          <div className="mt-4">
            <Field label="その他特記事項（事前承認がある場合もこちらへ記入）" required>
              <textarea name="specialNotes" rows={3} required className={inputCls} />
            </Field>
          </div>
        )}
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

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          企画へ申請する
        </button>
      </div>
    </form>

    {showMarginWarning && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 className="text-base font-semibold text-slate-900">特価申請について</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            ムトウ全体の利益を確保するため、通常仕切りで計算した際に一定の割合以上の粗利がある場合は特価不要とさせていただきます。
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowMarginWarning(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              納入価を訂正する
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
            >
              特価申請を終了する
            </button>
          </div>
        </div>
      </div>
    )}

    {showGuidelineWarning && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 className="text-base font-semibold text-slate-900">特価申請について</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            希望仕切り金額が特価目安を下回る場合、申請却下になる場合があります。WiSM企画に事前相談済みの場合は相談済みタブを押してください。
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowGuidelineWarning(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => {
                setPreApproved(true);
                setShowGuidelineWarning(false);
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
            >
              相談済み
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

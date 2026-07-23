import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getRequestById } from "@/lib/requests-repo";
import { getCurrentUser } from "@/lib/session";
import {
  updateItemDecisionAction,
  updatePlanningRemarksAction,
} from "@/lib/actions";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatNumber(n: number | null): string {
  if (n === null) return "-";
  return n.toLocaleString("ja-JP");
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || "-"}</dd>
    </div>
  );
}

const decisionSelectCls =
  "rounded-md border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const request = getRequestById(id);
  if (!request) return notFound();

  const isPlanning = user.role === "企画";
  if (!isPlanning && request.createdBy !== user.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          この申請を閲覧する権限がありません。
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-4">
        <Link href="/tokka/requests" className="text-sm text-slate-500 hover:underline">
          ← 申請一覧へ戻る
        </Link>
      </div>

      {sp.submitted === "1" && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          申請を送信しました。企画側の確認をお待ちください。
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">
          特価申請詳細
        </h1>
        <StatusBadge status={request.status} />
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">申請者情報</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="申請日" value={request.applicationDate} />
            <InfoItem label="店所名" value={request.branchName} />
            <InfoItem label="店所コード" value={request.branchCode} />
            <InfoItem label="所属長名" value={request.supervisorName} />
            <InfoItem label="担当者名" value={request.staffName} />
            <InfoItem label="社員番号" value={request.employeeNumber} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">得意先情報</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="得意先施設名" value={request.customerFacilityName} />
            <InfoItem label="施設内の納入部所" value={request.deliveryDepartment} />
            <InfoItem
              label="得意先コード"
              value={request.customerCodes.length > 0 ? request.customerCodes.join(", ") : null}
            />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">商品明細</h2>
          <p className="mt-1 text-xs text-slate-500">
            企画担当者はここで各商品の承認・却下・金額変更を行えます。
          </p>
          <div className="mt-4 space-y-4">
            {request.items.map((item, idx) => {
              const discount =
                item.standardWholesalePrice !== null && item.desiredWholesalePrice !== null
                  ? item.standardWholesalePrice - item.desiredWholesalePrice
                  : null;
              return (
                <div key={item.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      商品 {idx + 1}: {item.productName || "-"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.decision === "承認"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.decision === "却下"
                          ? "bg-rose-100 text-rose-800"
                          : item.decision === "金額変更"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.decision}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <InfoItem label="メーカーコード" value={item.makerCode} />
                    <InfoItem label="商品コード" value={item.productCode} />
                    <InfoItem label="梱包単位" value={item.packingUnit} />
                    <InfoItem label="商品略称" value={item.productAbbreviation} />
                    <InfoItem label="納入価" value={formatNumber(item.deliveryPrice)} />
                    <InfoItem label="通常仕切" value={formatNumber(item.standardWholesalePrice)} />
                    <InfoItem label="希望仕切額" value={formatNumber(item.desiredWholesalePrice)} />
                    <InfoItem label="希望値引額" value={formatNumber(discount)} />
                    <InfoItem label="月平均販売量" value={item.monthlyAvgSales} />
                    <InfoItem label="納入開始日" value={item.deliveryStartDate} />
                    <InfoItem label="終了日" value={item.endDate} />
                    <InfoItem label="特価登録もする？" value={item.registerSpecialPrice} />
                    <InfoItem
                      label="同商品同得意先で特価登録済み"
                      value={item.existingSpecialPriceFlag ? "はい" : "いいえ"}
                    />
                  </dl>

                  {isPlanning && (
                    <form
                      action={updateItemDecisionAction}
                      className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          判定
                        </label>
                        <select
                          name="decision"
                          defaultValue={item.decision}
                          className={decisionSelectCls}
                        >
                          <option value="未決定">未決定</option>
                          <option value="承認">承認</option>
                          <option value="却下">却下</option>
                          <option value="金額変更">金額変更</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          決定仕切額
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="decidedWholesalePrice"
                          defaultValue={item.decidedWholesalePrice ?? ""}
                          className={`${decisionSelectCls} w-32`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        更新
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            既納入品・競合提示製品情報
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoItem label="メーカー名" value={request.competitorMakerName} />
            <InfoItem label="商品名" value={request.competitorProductName} />
            <InfoItem label="商品コード" value={request.competitorProductCode} />
            <InfoItem label="JANコード" value={request.competitorJanCode} />
            <InfoItem label="仕入価格" value={request.competitorPurchasePrice} />
            <InfoItem label="納入価" value={request.competitorDeliveryPrice} />
            <InfoItem label="納入業者" value={request.competitorVendor} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            特価申請理由・特記事項
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4">
            <InfoItem label="特価申請理由" value={request.reasonType} />
            <InfoItem label="その他特記事項" value={request.specialNotes} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            企画側 備考
          </h2>
          {isPlanning ? (
            <form action={updatePlanningRemarksAction} className="mt-3 space-y-3">
              <input type="hidden" name="requestId" value={request.id} />
              <textarea
                name="remarks"
                rows={3}
                defaultValue={request.planningRemarks ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                備考を保存
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
              {request.planningRemarks || "（まだ記入がありません）"}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

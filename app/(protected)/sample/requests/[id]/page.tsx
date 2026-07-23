import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSampleRequestById } from "@/lib/sample-repo";
import { getCurrentUser } from "@/lib/session";
import { updateSampleProcessingAction } from "@/lib/sample-actions";
import SampleStatusBadge from "@/components/SampleStatusBadge";

export const dynamic = "force-dynamic";

function formatNumber(n: number | null): string {
  if (n === null) return "-";
  return n.toLocaleString("ja-JP");
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 whitespace-pre-wrap">{value || "-"}</dd>
    </div>
  );
}

const fieldCls =
  "rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default async function SampleRequestDetailPage({
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

  const request = getSampleRequestById(id);
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
        <Link href="/sample/requests" className="text-sm text-slate-500 hover:underline">
          ← 一覧へ戻る
        </Link>
      </div>

      {sp.submitted === "1" && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          申請を送信しました。企画側の確認をお待ちください。
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">
          サンプル依頼 詳細（{request.requestNo}）
        </h1>
        <SampleStatusBadge status={request.status} />
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">申請情報</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="申請日" value={request.requestDate} />
            <InfoItem label="申請先" value={request.destination} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">申請者・責任者</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="社員番号" value={request.requesterEmployeeNumber} />
            <InfoItem label="氏名" value={request.requesterName} />
            <InfoItem label="部署" value={request.requesterDepartment} />
            <InfoItem label="責任者コード" value={request.responsibleCode} />
            <InfoItem label="責任者名" value={request.responsibleName} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">目的・現況</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem
              label="目的"
              value={request.purpose === "その他" ? request.purposeOtherText : request.purpose}
            />
            <InfoItem label="現在納入業者" value={request.currentVendor} />
            <InfoItem label="現在納入商品【他社競合品名】" value={request.currentProduct} />
          </dl>
          <div className="mt-3">
            <InfoItem label="特記事項" value={request.notes} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">サンプル明細</h2>
          <div className="mt-4 space-y-4">
            {request.items.map((item, idx) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  明細 {idx + 1}: {item.productName || "-"}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <InfoItem label="サンプル管理番号" value={item.sampleManagementNo} />
                  <InfoItem label="メーカーコード" value={item.makerCode} />
                  <InfoItem label="商品コード" value={item.productCode} />
                  <InfoItem label="梱包単位" value={item.packingUnit} />
                  <InfoItem label="依頼数量" value={item.requestQuantity} />
                  <InfoItem label="依頼単位" value={item.requestUnit} />
                  <InfoItem label="得意先コード" value={item.customerCode} />
                  <InfoItem label="得意先名" value={item.customerName} />
                  <InfoItem label="納入予定価格" value={formatNumber(item.plannedPrice)} />
                  <InfoItem label="納入予定数量" value={item.plannedQuantity} />
                  <InfoItem label="納入予定日" value={item.plannedDate} />
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">企画・物流処理</h2>
          {isPlanning ? (
            <form action={updateSampleProcessingAction} className="mt-3 space-y-4">
              <input type="hidden" name="requestId" value={request.id} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    ステータス
                  </label>
                  <select name="status" defaultValue={request.status} className={fieldCls}>
                    <option value="submitted">申請中</option>
                    <option value="in_progress">処理中</option>
                    <option value="completed">完了</option>
                    <option value="rejected">却下</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">審査日</label>
                  <input
                    type="date"
                    name="reviewDate"
                    defaultValue={request.reviewDate ?? ""}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    企画処理日
                  </label>
                  <input
                    type="date"
                    name="planningProcessedDate"
                    defaultValue={request.planningProcessedDate ?? ""}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    物流処理日
                  </label>
                  <input
                    type="date"
                    name="logisticsProcessedDate"
                    defaultValue={request.logisticsProcessedDate ?? ""}
                    className={fieldCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    企画コメント
                  </label>
                  <textarea
                    name="planningComment"
                    rows={3}
                    defaultValue={request.planningComment ?? ""}
                    className={`${fieldCls} w-full`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    物流コメント
                  </label>
                  <textarea
                    name="logisticsComment"
                    rows={3}
                    defaultValue={request.logisticsComment ?? ""}
                    className={`${fieldCls} w-full`}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                更新
              </button>
            </form>
          ) : (
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="企画コメント" value={request.planningComment} />
              <InfoItem label="物流コメント" value={request.logisticsComment} />
              <InfoItem label="審査日" value={request.reviewDate} />
              <InfoItem label="企画処理日" value={request.planningProcessedDate} />
              <InfoItem label="物流処理日" value={request.logisticsProcessedDate} />
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}

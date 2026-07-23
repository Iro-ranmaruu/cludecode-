import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDefectRequestById } from "@/lib/defect-repo";
import { getCurrentUser } from "@/lib/session";
import { updateDefectStatusAction } from "@/lib/defect-actions";
import DefectStatusBadge from "@/components/DefectStatusBadge";

export const dynamic = "force-dynamic";

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 whitespace-pre-wrap">{value || "-"}</dd>
    </div>
  );
}

export default async function DefectRequestDetailPage({
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

  const request = getDefectRequestById(id);
  if (!request) return notFound();

  const isPlanning = user.role === "企画";
  if (!isPlanning && request.createdBy !== user.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          この依頼を閲覧する権限がありません。
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-4">
        <Link href="/fuguai/requests" className="text-sm text-slate-500 hover:underline">
          ← 一覧へ戻る
        </Link>
      </div>

      {sp.submitted === "1" && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          依頼を送信しました。企画側の確認をお待ちください。
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">不具合処理依頼 詳細</h1>
        <DefectStatusBadge status={request.status} />
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">依頼者情報</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="依頼日" value={request.requestDate} />
            <InfoItem label="店所名" value={request.branchName} />
            <InfoItem label="店所コード" value={request.branchCode} />
            <InfoItem label="所属長名" value={request.supervisorName} />
            <InfoItem label="担当者名" value={request.staffName} />
            <InfoItem label="社員番号" value={request.employeeNumber} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">得意先情報</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoItem label="得意先施設名" value={request.customerFacilityName} />
            <InfoItem label="得意先コード" value={request.customerCode} />
            <InfoItem label="部署" value={request.department} />
            <InfoItem label="ご担当者名" value={request.contactPerson} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">商品明細・不具合内容</h2>
          <div className="mt-4 space-y-4">
            {request.items.map((item, idx) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  商品 {idx + 1}: {item.productName || "-"}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <InfoItem label="メーカーコード" value={item.makerCode} />
                  <InfoItem label="商品コード" value={item.productCode} />
                  <InfoItem label="梱包単位" value={item.packingUnit} />
                  <InfoItem label="数量" value={item.quantity} />
                  <InfoItem label="ロットNO." value={item.lotNo} />
                  <InfoItem label="不具合内容" value={item.defectCategory} />
                </dl>
                <div className="mt-3">
                  <InfoItem label="不具合内容詳細" value={item.defectDetail} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">不具合品送付先</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4">
            <InfoItem label="送付先" value={request.sendDestination} />
            <InfoItem label="特記事項" value={request.sendDestinationNotes} />
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">依頼内容</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoItem
              label="① メーカーから文書による回答"
              value={request.needsWrittenResponse ? "必要" : "不要"}
            />
            <InfoItem
              label="② 代替品"
              value={request.needsReplacement ? "必要" : "不要"}
            />
            {request.needsReplacement && (
              <InfoItem
                label="代替品数量・単位"
                value={`${request.replacementQuantity || "-"} ${request.replacementUnit || ""}`}
              />
            )}
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">その他</h2>
          <InfoItem label="" value={request.otherNotes} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">企画側 処理</h2>
          {isPlanning ? (
            <form action={updateDefectStatusAction} className="mt-3 space-y-3">
              <input type="hidden" name="requestId" value={request.id} />
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    ステータス
                  </label>
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="submitted">申請中</option>
                    <option value="in_progress">対応中</option>
                    <option value="completed">完了</option>
                    <option value="rejected">却下</option>
                  </select>
                </div>
              </div>
              <textarea
                name="planningComment"
                rows={3}
                placeholder="企画コメント"
                defaultValue={request.planningComment ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                更新
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
              {request.planningComment || "（まだコメントがありません）"}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { listRequests } from "@/lib/requests-repo";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default function RequestsPage() {
  const requests = listRequests();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">申請一覧</h1>
          <p className="mt-1 text-sm text-slate-600">
            営業から届いた特価申請です。クリックすると詳細・承認画面へ移動します。
          </p>
        </div>
        <Link
          href="/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          + 新規申請
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          まだ申請がありません。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">申請日</th>
                <th className="px-4 py-3">店所名</th>
                <th className="px-4 py-3">担当者名</th>
                <th className="px-4 py-3">得意先施設名</th>
                <th className="px-4 py-3">商品数</th>
                <th className="px-4 py-3">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/requests/${r.id}`}
                      className="block text-slate-900 hover:underline"
                    >
                      {r.applicationDate || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/requests/${r.id}`} className="block hover:underline">
                      {r.branchName || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.staffName || "-"}</td>
                  <td className="px-4 py-3">{r.customerFacilityName || "-"}</td>
                  <td className="px-4 py-3">{r.items.length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

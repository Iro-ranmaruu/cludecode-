import Link from "next/link";
import { redirect } from "next/navigation";
import { listDefectRequests } from "@/lib/defect-repo";
import { getCurrentUser } from "@/lib/session";
import DefectStatusBadge from "@/components/DefectStatusBadge";

export const dynamic = "force-dynamic";

export default async function DefectRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const all = listDefectRequests();
  const requests = user.role === "企画" ? all : all.filter((r) => r.createdBy === user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">不具合処理依頼 処理状況一覧</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user.role === "企画"
              ? "営業から届いた不具合処理依頼です。クリックすると詳細画面へ移動します。"
              : "あなたが依頼した不具合処理依頼の一覧です。"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === "企画" && (
            <a
              href="/api/export/fuguai"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              CSVダウンロード
            </a>
          )}
          <Link
            href="/fuguai/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            + 新規依頼
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          まだ依頼がありません。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">依頼日</th>
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
                    <Link href={`/fuguai/requests/${r.id}`} className="block text-slate-900 hover:underline">
                      {r.requestDate || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/fuguai/requests/${r.id}`} className="block hover:underline">
                      {r.branchName || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.staffName || "-"}</td>
                  <td className="px-4 py-3">{r.customerFacilityName || "-"}</td>
                  <td className="px-4 py-3">{r.items.length}</td>
                  <td className="px-4 py-3">
                    <DefectStatusBadge status={r.status} />
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

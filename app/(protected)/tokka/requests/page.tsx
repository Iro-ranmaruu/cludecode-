import Link from "next/link";
import { redirect } from "next/navigation";
import { listRequests } from "@/lib/requests-repo";
import { getCurrentUser } from "@/lib/session";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const allRequests = listRequests();
  const requests =
    user.role === "企画"
      ? allRequests
      : allRequests.filter((r) => r.createdBy === user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">特価申請 処理状況一覧</h1>
            <p className="mt-1 text-sm text-slate-600">
              {user.role === "企画"
                ? "営業から届いた特価申請です。クリックすると詳細・承認画面へ移動します。"
                : "あなたが申請した特価申請の一覧です。"}
            </p>
          </div>
          <Link
            href="/tokka/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            + 新規申請
          </Link>
        </div>

        {user.role === "企画" && (
          <form
            action="/api/export/tokka"
            method="GET"
            className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                申請日（開始）
              </label>
              <input
                type="date"
                name="from"
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                申請日（終了）
              </label>
              <input
                type="date"
                name="to"
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              CSVダウンロード
            </button>
            <p className="basis-full text-xs text-slate-400">
              期間を指定しない場合は全期間のデータをダウンロードします。
            </p>
          </form>
        )}
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
                      href={`/tokka/requests/${r.id}`}
                      className="block text-slate-900 hover:underline"
                    >
                      {r.applicationDate || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/tokka/requests/${r.id}`} className="block hover:underline">
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

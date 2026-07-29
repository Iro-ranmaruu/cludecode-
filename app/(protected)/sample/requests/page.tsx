import Link from "next/link";
import { redirect } from "next/navigation";
import { listSampleRequests } from "@/lib/sample-repo";
import { getCurrentUser } from "@/lib/session";
import { DESTINATION_OPTIONS } from "@/lib/sample-types";
import SampleStatusBadge from "@/components/SampleStatusBadge";

export const dynamic = "force-dynamic";

export default async function SampleRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const all = listSampleRequests();
  const requests = user.role === "企画" ? all : all.filter((r) => r.createdBy === user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">サンプル依頼 処理状況一覧</h1>
            <p className="mt-1 text-sm text-slate-600">
              {user.role === "企画"
                ? "営業から届いたサンプル依頼です。クリックすると詳細画面へ移動します。"
                : "あなたが申請したサンプル依頼の一覧です。"}
            </p>
          </div>
          <Link
            href="/sample/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            + 新規申請
          </Link>
        </div>

        {user.role === "企画" && (
          <form
            action="/api/export/sample"
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
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-500">申請先</span>
              <div className="flex flex-wrap gap-3 pt-1.5">
                {DESTINATION_OPTIONS.map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="destinations"
                      value={d}
                      defaultChecked
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              CSVダウンロード
            </button>
            <p className="basis-full text-xs text-slate-400">
              期間を指定しない場合は全期間、申請先をすべて選択すると全国分のデータをダウンロードします。
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
                <th className="px-4 py-3">申請番号</th>
                <th className="px-4 py-3">申請日</th>
                <th className="px-4 py-3">申請先</th>
                <th className="px-4 py-3">申請者</th>
                <th className="px-4 py-3">明細数</th>
                <th className="px-4 py-3">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/sample/requests/${r.id}`} className="block text-slate-900 hover:underline">
                      {r.requestNo || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/sample/requests/${r.id}`} className="block hover:underline">
                      {r.requestDate || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.destination || "-"}</td>
                  <td className="px-4 py-3">{r.requesterName || "-"}</td>
                  <td className="px-4 py-3">{r.items.length}</td>
                  <td className="px-4 py-3">
                    <SampleStatusBadge status={r.status} />
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

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listCustomerMaster } from "@/lib/customer-master-repo";
import {
  addCustomerMasterRowAction,
  deleteCustomerMasterRowAction,
  importCustomerMasterCsvAction,
} from "@/lib/customer-actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export default async function CustomerMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "企画") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          このページは企画権限のユーザーのみ利用できます。
        </div>
      </div>
    );
  }

  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const allRows = listCustomerMaster();
  const rows = query
    ? allRows.filter(
        (r) => r.customerCode.includes(query) || r.customerName.includes(query)
      )
    : allRows;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-slate-900">得意先マスタ管理</h1>
      <p className="mt-1 text-sm text-slate-600">
        得意先コード（先頭6桁）と得意先施設名を登録します。特価申請フォームで得意先コードを入力すると、
        ここに登録された得意先施設名が自動反映されます。
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">CSV一括インポート</h2>
        <p className="mt-1 text-xs text-slate-500">
          1行につき「得意先コード,得意先施設名」の順で貼り付けてください（ヘッダー行があっても構いません）。
          既存の得意先コードと一致する行は上書きされます。
        </p>
        <form action={importCustomerMasterCsvAction} className="mt-3 space-y-3">
          <textarea
            name="csvText"
            rows={6}
            placeholder={"得意先コード,得意先施設名\nTL9999,WiSM病院"}
            className={`${inputCls} font-mono`}
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            インポート
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">1件ずつ登録</h2>
        <form
          action={addCustomerMasterRowAction}
          className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <div>
            <label className={labelCls}>得意先コード（先頭6桁）</label>
            <input name="customerCode" maxLength={6} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>得意先施設名</label>
            <input name="customerName" required className={inputCls} />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              登録
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            登録済み得意先マスタ（全{allRows.length}件{query ? `、検索結果${rows.length}件` : ""}）
          </h2>
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="得意先コード・得意先施設名で検索"
              className={`${inputCls} w-72`}
            />
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              検索
            </button>
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            該当する得意先マスタがありません。
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">得意先コード</th>
                  <th className="px-4 py-2">得意先施設名</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.customerCode}>
                    <td className="px-4 py-2">{r.customerCode}</td>
                    <td className="px-4 py-2">{r.customerName}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={deleteCustomerMasterRowAction}>
                        <input type="hidden" name="customerCode" value={r.customerCode} />
                        <button type="submit" className="text-xs text-rose-600 hover:text-rose-800">
                          削除
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

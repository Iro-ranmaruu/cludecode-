import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listEmployeeDirectory } from "@/lib/employee-directory-repo";
import {
  addEmployeeDirectoryRowAction,
  deleteEmployeeDirectoryRowAction,
  importEmployeeDirectoryCsvAction,
} from "@/lib/employee-actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export default async function EmployeeDirectoryPage({
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
  const allRows = listEmployeeDirectory();
  const rows = query
    ? allRows.filter(
        (r) =>
          r.name.includes(query) ||
          (r.employeeNumber || "").includes(query) ||
          r.email.includes(query)
      )
    : allRows;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-slate-900">人事台帳（社員名簿）管理</h1>
      <p className="mt-1 text-sm text-slate-600">
        氏名（および分かる場合は社員番号）とメールアドレスを登録します。特価申請・不具合処理依頼・サンプル依頼が
        企画によって処理された際、申請者への処理結果メールの宛先はここに登録されたメールアドレスが優先的に使われます
        （登録がない場合は、申請者本人がアカウント登録時に入力したメールアドレスにフォールバックします）。
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">CSV一括インポート</h2>
        <p className="mt-1 text-xs text-slate-500">
          1行につき「社員番号,氏名,メールアドレス」の順で貼り付けてください（ヘッダー行があっても構いません。
          社員番号が分からない場合は空欄でよく、その場合は氏名で照合します）。既存の社員番号／氏名と一致する行は上書きされます。
        </p>
        <form action={importEmployeeDirectoryCsvAction} className="mt-3 space-y-3">
          <textarea
            name="csvText"
            rows={6}
            placeholder={"社員番号,氏名,メールアドレス\n,飯田彩葉,iroha_iida@ni.wism-mutoh.co.jp"}
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
          action={addEmployeeDirectoryRowAction}
          className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <div>
            <label className={labelCls}>社員番号（任意）</label>
            <input name="employeeNumber" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>氏名</label>
            <input name="name" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>メールアドレス</label>
            <input type="email" name="email" required className={inputCls} />
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
            登録済み人事台帳（全{allRows.length}件{query ? `、検索結果${rows.length}件` : ""}）
          </h2>
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="社員番号・氏名・メールアドレスで検索"
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
            該当する登録がありません。
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">社員番号</th>
                  <th className="px-4 py-2">氏名</th>
                  <th className="px-4 py-2">メールアドレス</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{r.employeeNumber || "-"}</td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{r.email}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={deleteEmployeeDirectoryRowAction}>
                        <input type="hidden" name="id" value={r.id} />
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

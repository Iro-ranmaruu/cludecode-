import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listProductMaster } from "@/lib/product-master-repo";
import {
  addProductMasterRowAction,
  deleteProductMasterRowAction,
  importProductMasterCsvAction,
} from "@/lib/master-actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export default async function ProductMasterPage() {
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

  const rows = listProductMaster();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-slate-900">商品マスタ管理</h1>
      <p className="mt-1 text-sm text-slate-600">
        メーカーコード＋商品コードをキーに、商品名・梱包単位を登録します。特価申請・不具合処理依頼・サンプル依頼の各フォームで、この情報が自動反映されます。
      </p>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">CSV一括インポート</h2>
        <p className="mt-1 text-xs text-slate-500">
          1行につき「メーカーコード,商品コード,商品名,梱包単位」の順で貼り付けてください（ヘッダー行があっても構いません）。既存の組み合わせは上書きされます。
        </p>
        <form action={importProductMasterCsvAction} className="mt-3 space-y-3">
          <textarea
            name="csvText"
            rows={6}
            placeholder={"メーカーコード,商品コード,商品名,梱包単位\n71168,WDM2-W,WiSMディスポマスクII,箱"}
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
          action={addProductMasterRowAction}
          className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <div>
            <label className={labelCls}>メーカーコード</label>
            <input name="makerCode" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>商品コード</label>
            <input name="productCode" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>商品名</label>
            <input name="productName" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>梱包単位</label>
            <input name="packingUnit" className={inputCls} />
          </div>
          <div className="col-span-2 sm:col-span-4">
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
        <h2 className="text-base font-semibold text-slate-900">
          登録済みマスタ（{rows.length}件）
        </h2>
        {rows.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            まだ商品マスタが登録されていません。
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">メーカーコード</th>
                  <th className="px-4 py-2">商品コード</th>
                  <th className="px-4 py-2">商品名</th>
                  <th className="px-4 py-2">梱包単位</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={`${r.makerCode}-${r.productCode}`}>
                    <td className="px-4 py-2">{r.makerCode}</td>
                    <td className="px-4 py-2">{r.productCode}</td>
                    <td className="px-4 py-2">{r.productName}</td>
                    <td className="px-4 py-2">{r.packingUnit || "-"}</td>
                    <td className="px-4 py-2 text-right">
                      <form action={deleteProductMasterRowAction}>
                        <input type="hidden" name="makerCode" value={r.makerCode} />
                        <input type="hidden" name="productCode" value={r.productCode} />
                        <button
                          type="submit"
                          className="text-xs text-rose-600 hover:text-rose-800"
                        >
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

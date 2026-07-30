import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

const MODULES = [
  {
    key: "tokka",
    title: "特価申請",
    description: "WiSM商品の特別価格申請を入力・承認します。",
    newHref: "/tokka/new",
    listHref: "/tokka/requests",
  },
  {
    key: "fuguai",
    title: "不具合処理依頼",
    description: "WiSM製品の不具合品について処理を依頼します。",
    newHref: "/fuguai/new",
    listHref: "/fuguai/requests",
  },
  {
    key: "sample",
    title: "サンプル依頼",
    description: "WiSM製品のサンプル提供を申請します。",
    newHref: "/sample/new",
    listHref: "/sample/requests",
  },
];

export default async function MainMenuPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        WiSM製品アプリ
      </h1>
      <p className="mt-2 text-slate-600">
        {user?.name} さん（{user?.branchName || "-"}・{user?.role}）としてログイン中です。
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <div
            key={m.key}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{m.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{m.description}</p>
            <div className="mt-4 flex gap-3 text-sm font-medium">
              <Link
                href={m.newHref}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                新規申請
              </Link>
              <Link
                href={m.listHref}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                処理状況一覧
              </Link>
            </div>
          </div>
        ))}

        {user?.role === "企画" && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">商品マスタ</h2>
            <p className="mt-2 text-sm text-slate-600">
              メーカーコード＋商品コードに対応する商品名・梱包単位を管理します。
            </p>
            <div className="mt-4 flex gap-3 text-sm font-medium">
              <Link
                href="/master"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                マスタ管理を開く
              </Link>
            </div>
          </div>
        )}

        {user?.role === "企画" && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">人事台帳</h2>
            <p className="mt-2 text-sm text-slate-600">
              氏名・社員番号とメールアドレスを管理します。処理結果メールの宛先解決に使われます。
            </p>
            <div className="mt-4 flex gap-3 text-sm font-medium">
              <Link
                href="/employees"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                人事台帳を開く
              </Link>
            </div>
          </div>
        )}

        {user?.role === "企画" && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">データエクスポート</h2>
            <p className="mt-2 text-sm text-slate-600">
              各モジュールの申請データをCSVで一括ダウンロードします（企画権限のみ）。
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              <a
                href="/api/export/tokka"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                特価申請CSV
              </a>
              <a
                href="/api/export/fuguai"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                不具合処理依頼CSV
              </a>
              <a
                href="/api/export/sample"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                サンプル依頼CSV
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

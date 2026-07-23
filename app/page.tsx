import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        WiSM商品 特別価格申請システム
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        営業から企画への特価申請をWeb上で行い、企画側が一覧で確認・承認できるアプリです。
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/new"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">
            営業：新規特価申請
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            店所情報・得意先情報・商品明細を入力して企画へ申請します。
          </p>
        </Link>

        <Link
          href="/requests"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-400 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-900 group-hover:text-slate-950">
            企画：申請一覧・承認
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            届いている申請を一覧で確認し、商品ごとに承認・却下・金額変更を行います。
          </p>
        </Link>
      </div>
    </div>
  );
}

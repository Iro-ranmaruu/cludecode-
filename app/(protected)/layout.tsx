import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            WiSM製品総合アプリ
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <Link href="/tokka/requests" className="text-slate-600 hover:text-slate-900">
              特価申請
            </Link>
            <Link href="/fuguai/requests" className="text-slate-600 hover:text-slate-900">
              不具合処理依頼
            </Link>
            <Link href="/sample/requests" className="text-slate-600 hover:text-slate-900">
              サンプル依頼
            </Link>
            {user.role === "企画" && (
              <Link href="/master" className="text-slate-600 hover:text-slate-900">
                商品マスタ
              </Link>
            )}
            <span className="mx-1 h-4 w-px bg-slate-200" />
            <span className="text-slate-500">
              {user.name}（{user.employeeNumber}・{user.role}）
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}

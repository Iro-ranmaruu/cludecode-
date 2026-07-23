import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "WiSM特価申請システム",
  description: "WiSM商品 特別価格申請の入力・承認アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              WiSM特価申請システム
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/new" className="text-slate-600 hover:text-slate-900">
                新規申請
              </Link>
              <Link href="/requests" className="text-slate-600 hover:text-slate-900">
                申請一覧・承認
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

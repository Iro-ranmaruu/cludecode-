import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WiSM製品総合アプリ",
  description: "WiSM製品の特価申請・不具合処理依頼・サンプル依頼を行う社内アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

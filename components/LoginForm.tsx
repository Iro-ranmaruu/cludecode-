"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthActionState } from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginFormAction, loginPending] = useActionState<AuthActionState, FormData>(
    loginAction,
    null
  );
  const [registerState, registerFormAction, registerPending] = useActionState<
    AuthActionState,
    FormData
  >(registerAction, null);

  return (
    <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/wism-product-logo.svg" alt="WiSM" className="mx-auto mb-4 h-20 w-auto" />
      <h1 className="text-lg font-bold text-slate-900">WiSM製品アプリ</h1>
      <p className="mt-1 text-xs text-slate-500">
        {mode === "login" ? "社員番号とパスワードでログインしてください。" : "初めての方はこちらからアカウントを作成してください。"}
      </p>

      <div className="mt-4 flex gap-2 border-b border-slate-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`px-3 py-2 -mb-px border-b-2 ${
            mode === "login"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`px-3 py-2 -mb-px border-b-2 ${
            mode === "register"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          初めての方（新規登録）
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginFormAction} className="mt-5 space-y-4">
          <div>
            <label className={labelCls}>社員番号</label>
            <input name="employeeNumber" required className={inputCls} autoFocus />
          </div>
          <div>
            <label className={labelCls}>パスワード</label>
            <input type="password" name="password" required className={inputCls} />
          </div>
          {loginState?.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {loginState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={loginPending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loginPending ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      ) : (
        <form action={registerFormAction} className="mt-5 space-y-4">
          <div>
            <label className={labelCls}>社員番号</label>
            <input name="employeeNumber" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>氏名</label>
            <input name="name" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>店所名</label>
            <input name="branchName" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>権限</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="role" value="営業" defaultChecked /> 営業
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="role" value="企画" /> 企画
              </label>
            </div>
          </div>
          <div>
            <label className={labelCls}>パスワード</label>
            <input type="password" name="password" required minLength={4} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>パスワード（確認）</label>
            <input
              type="password"
              name="passwordConfirm"
              required
              minLength={4}
              className={inputCls}
            />
          </div>
          {registerState?.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {registerState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={registerPending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {registerPending ? "登録中..." : "登録してログイン"}
          </button>
        </form>
      )}
    </div>
  );
}

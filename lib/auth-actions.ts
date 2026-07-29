"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmployeeNumber,
  verifyPassword,
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export type AuthActionState = { error?: string } | null;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

async function setSessionCookie(userId: string) {
  const token = createSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const employeeNumber = str(formData, "employeeNumber").trim();
  const password = str(formData, "password");

  if (!employeeNumber || !password) {
    return { error: "社員番号とパスワードを入力してください" };
  }

  const user = verifyPassword(employeeNumber, password);
  if (!user) {
    return { error: "社員番号またはパスワードが違います" };
  }

  await setSessionCookie(user.id);
  redirect("/");
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const employeeNumber = str(formData, "employeeNumber").trim();
  const password = str(formData, "password");
  const passwordConfirm = str(formData, "passwordConfirm");
  const name = str(formData, "name").trim();
  const branchName = str(formData, "branchName").trim();
  const email = str(formData, "email").trim();
  const role = str(formData, "role") === "企画" ? "企画" : "営業";

  if (!employeeNumber || !password || !name || !branchName || !email) {
    return { error: "社員番号・氏名・店所名・メールアドレス・パスワードを入力してください" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "メールアドレスの形式が正しくありません" };
  }
  if (password.length < 4) {
    return { error: "パスワードは4文字以上で入力してください" };
  }
  if (password !== passwordConfirm) {
    return { error: "パスワードが一致しません" };
  }
  if (findUserByEmployeeNumber(employeeNumber)) {
    return { error: "この社員番号は既に登録されています。ログインしてください" };
  }

  const user = createUser({ employeeNumber, password, name, branchName, role, email });
  await setSessionCookie(user.id);
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    deleteSession(token);
  }
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

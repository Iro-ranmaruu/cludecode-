import { cookies } from "next/headers";
import { getUserBySessionToken, type UserRecord } from "@/lib/auth";

export const SESSION_COOKIE = "wism_session";

export async function getCurrentUser(): Promise<UserRecord | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm />
    </div>
  );
}

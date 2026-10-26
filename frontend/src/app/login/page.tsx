import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
export const metadata = { title: "ورود" };
export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return <LoginForm />;
}

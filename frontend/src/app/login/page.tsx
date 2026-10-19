import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
export const metadata = { title: "ورود" };
export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  const demo =
    process.env.NODE_ENV !== "production" &&
    (!process.env.TDMS_LOGIN_PASSWORD ||
      process.env.TDMS_LOGIN_PASSWORD === "TdmsDemo!2026") &&
    (!process.env.TDMS_LOGIN_EMAIL ||
      process.env.TDMS_LOGIN_EMAIL === "admin@tdms.local");
  return <LoginForm demo={demo} />;
}

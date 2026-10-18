import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getSession())) redirect("/login");
  return children;
}

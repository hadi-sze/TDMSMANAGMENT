import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dataSource } from "@/lib/products";
import { Dashboard } from "@/components/dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <Dashboard email={session.email} mode={dataSource()}>
      {children}
    </Dashboard>
  );
}

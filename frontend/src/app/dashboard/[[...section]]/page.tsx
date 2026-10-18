import { notFound, redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getSession } from "@/lib/auth";
import { dataSource } from "@/lib/products";
export const metadata = { title: "Workspace" };
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const view = section?.[0] || "home";
  if (
    (section?.length || 0) > 1 ||
    !["home", "products", "companies", "analytics", "settings"].includes(view)
  )
    notFound();
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <Dashboard
      view={
        view as "home" | "products" | "companies" | "analytics" | "settings"
      }
      email={session.email}
      mode={dataSource()}
    />
  );
}

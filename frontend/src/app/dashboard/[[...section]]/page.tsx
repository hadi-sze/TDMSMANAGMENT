import { notFound } from "next/navigation";
export const metadata = { title: "فضای کاری" };
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const view = section?.[0] || "home";
  if (
    (section?.length || 0) > 1 ||
    ![
      "home",
      "products",
      "companies",
      "subcompanies",
      "analytics",
      "settings",
      "reports-oil",
      "reports-gas",
      "reports-products",
      "reports-operations",
      "reports-assets",
      "reports-shifts",
      "production-companies",
      "customers",
    ].includes(view)
  )
    notFound();
  return null;
}

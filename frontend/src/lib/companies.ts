import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
export { dataSource } from "@/lib/products";

export type Company = {
  id: number;
  name: string;
  address: string;
  companyID: string;
  companycode: string;
  isActive: boolean;
};
export const companySchema = z.object({
  name: z.string().trim().min(1, "Enter the company name.").max(200),
  address: z.string().trim().min(1, "Enter the company address.").max(500),
  companyID: z.string().trim().min(1, "Enter the company ID.").max(100),
  companycode: z.string().trim().min(1, "Enter the company code.").max(50),
  isActive: z.boolean(),
});
export type CompanyWrite = z.infer<typeof companySchema>;

const file = path.join(process.cwd(), ".data", "companies.json");
async function load(): Promise<{ nextId: number; companies: Company[] }> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { nextId: 1, companies: [] };
  }
}

const runtime = globalThis as typeof globalThis & {
  tdmsCompanyWrites?: Promise<unknown>;
};
export async function demoCompanies() {
  await runtime.tdmsCompanyWrites;
  return (await load()).companies;
}
export function demoCompanyWrite(
  action: "create" | "update" | "delete",
  id?: number,
  input?: CompanyWrite,
): Promise<Company | boolean | null> {
  const pending = (runtime.tdmsCompanyWrites || Promise.resolve()).then(
    async () => {
      const store = await load();
      let result: Company | boolean | null = null;
      if (action === "create" && input) {
        const company = { ...input, id: store.nextId++ };
        store.companies.push(company);
        result = company;
      }
      if (action === "update") {
        const company = store.companies.find((item) => item.id === id);
        if (!company) return null;
        Object.assign(company, input);
        result = company;
      }
      if (action === "delete") {
        if (!store.companies.some((item) => item.id === id)) return null;
        store.companies = store.companies.filter((item) => item.id !== id);
        result = true;
      }
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, JSON.stringify(store, null, 2));
      await rename(`${file}.tmp`, file);
      return result;
    },
  );
  runtime.tdmsCompanyWrites = pending.catch(() => undefined);
  return pending;
}

export async function companyUpstream(endpoint: string, init?: RequestInit) {
  const base = process.env.TDMS_API_BASE_URL || "http://localhost:5043";
  return fetch(`${base.replace(/\/$/, "")}/api/companies${endpoint}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
export { dataSource } from "@/lib/products";

export type SubCompany = {
  id: number;
  name: string;
  companyId: number;
  isActive: boolean;
};
export const subCompanySchema = z.object({
  name: z.string().trim().min(1, "Enter the subcompany name.").max(200),
  companyId: z
    .number()
    .int()
    .min(1, "Select a parent company.")
    .max(2147483647),
  isActive: z.boolean(),
});
export type SubCompanyWrite = z.infer<typeof subCompanySchema>;
export class MissingParentCompanyError extends Error {}

const file = path.join(process.cwd(), ".data", "subcompanies.json");
async function load(): Promise<{ nextId: number; subcompanies: SubCompany[] }> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { nextId: 1, subcompanies: [] };
  }
}
// Share the parent company's write queue so demo deletes and child writes stay atomic.
const runtime = globalThis as typeof globalThis & {
  tdmsCompanyWrites?: Promise<unknown>;
};
export async function demoSubCompanies() {
  await runtime.tdmsCompanyWrites;
  return (await load()).subcompanies;
}
export function demoSubCompanyWrite(
  action: "create" | "update" | "delete",
  id?: number,
  input?: SubCompanyWrite,
): Promise<SubCompany | boolean | null> {
  const pending = (runtime.tdmsCompanyWrites || Promise.resolve()).then(
    async () => {
      const store = await load();
      if (
        action !== "create" &&
        !store.subcompanies.some((item) => item.id === id)
      )
        return null;
      if (input) {
        let parents: { companies: { id: number }[] } = { companies: [] };
        try {
          parents = JSON.parse(
            await readFile(
              path.join(process.cwd(), ".data", "companies.json"),
              "utf8",
            ),
          );
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        if (!parents.companies.some((parent) => parent.id === input.companyId))
          throw new MissingParentCompanyError(
            "The selected parent company does not exist.",
          );
      }
      let result: SubCompany | boolean | null = null;
      if (action === "create" && input) {
        const item = { ...input, id: store.nextId++ };
        store.subcompanies.push(item);
        result = item;
      } else if (action === "update" && input) {
        const item = store.subcompanies.find((item) => item.id === id)!;
        Object.assign(item, input);
        result = item;
      } else if (action === "delete") {
        store.subcompanies = store.subcompanies.filter(
          (item) => item.id !== id,
        );
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
export async function subCompanyUpstream(endpoint: string, init?: RequestInit) {
  const base = process.env.TDMS_API_BASE_URL || "http://localhost:5043";
  return fetch(`${base.replace(/\/$/, "")}/api/subcompanies${endpoint}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

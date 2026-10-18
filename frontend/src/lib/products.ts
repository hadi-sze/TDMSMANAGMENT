import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  createdAtUtc: string;
};
export const productSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((value) => value || null),
  price: z
    .number()
    .finite()
    .min(0)
    .max(999999999.99)
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
      "Use at most two decimal places.",
    ),
  stockQuantity: z.number().int().min(0).max(2147483647),
});
export type ProductWrite = z.infer<typeof productSchema>;
export const dataSource = () =>
  process.env.TDMS_DATA_SOURCE === "api" ? "api" : "demo";

const file = path.join(process.cwd(), ".data", "products.json");
const initial: Product[] = [
  {
    id: 1,
    name: "Wireless keyboard",
    description: "Compact mechanical keyboard with Bluetooth",
    price: 89,
    stockQuantity: 48,
    createdAtUtc: "2026-10-10T10:00:00Z",
  },
  {
    id: 2,
    name: "USB-C docking station",
    description: "One connection for your whole workspace",
    price: 129,
    stockQuantity: 23,
    createdAtUtc: "2026-10-11T10:00:00Z",
  },
  {
    id: 3,
    name: "Studio headphones",
    description: "Over-ear headphones for focused work",
    price: 159,
    stockQuantity: 8,
    createdAtUtc: "2026-10-12T10:00:00Z",
  },
  {
    id: 4,
    name: "Desk light",
    description: "Adjustable lighting, designed for your desk",
    price: 45,
    stockQuantity: 64,
    createdAtUtc: "2026-10-13T10:00:00Z",
  },
  {
    id: 5,
    name: "4K monitor",
    description: "27-inch display with a little more clarity",
    price: 349,
    stockQuantity: 12,
    createdAtUtc: "2026-10-14T10:00:00Z",
  },
  {
    id: 6,
    name: "Laptop stand",
    description: "Aluminum stand with adjustable height",
    price: 39,
    stockQuantity: 0,
    createdAtUtc: "2026-10-15T10:00:00Z",
  },
];

async function load(): Promise<{ nextId: number; products: Product[] }> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { nextId: 7, products: initial.map((item) => ({ ...item })) };
  }
}

let writes: Promise<unknown> = Promise.resolve();
export async function demoProducts() {
  await writes;
  return (await load()).products;
}
export function demoWrite(
  action: "create" | "update" | "delete",
  id?: number,
  input?: ProductWrite,
): Promise<Product | boolean | null> {
  const pending = writes.then(async () => {
    const store = await load();
    let result: Product | boolean | null = null;
    if (action === "create" && input) {
      const item = {
        ...input,
        id: store.nextId++,
        createdAtUtc: new Date().toISOString(),
      };
      store.products.push(item);
      result = item;
    }
    if (action === "update") {
      const item = store.products.find((product) => product.id === id);
      if (!item) return null;
      Object.assign(item, input);
      result = item;
    }
    if (action === "delete") {
      if (!store.products.some((product) => product.id === id)) return null;
      store.products = store.products.filter((product) => product.id !== id);
      result = true;
    }
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(store, null, 2));
    await rename(`${file}.tmp`, file);
    return result;
  });
  writes = pending.catch(() => undefined);
  return pending;
}

export async function upstream(endpoint: string, init?: RequestInit) {
  const base = process.env.TDMS_API_BASE_URL || "http://localhost:5043";
  return fetch(`${base.replace(/\/$/, "")}/api/products${endpoint}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

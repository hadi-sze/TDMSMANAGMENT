export type ImportTarget = "companies" | "subcompanies";
export type ImportRow = Record<string, string>;
export const importFields = {
  companies: [
    { key: "name", label: "نام شرکت", max: 200 },
    { key: "address", label: "نشانی", max: 500 },
    { key: "companyID", label: "شناسه تجاری شرکت", max: 100 },
    { key: "companycode", label: "کد شرکت", max: 50 },
    { key: "isActive", label: "وضعیت فعال", max: 20 },
  ],
  subcompanies: [
    { key: "name", label: "نام شرکت تابعه", max: 200 },
    { key: "companyId", label: "شناسه عددی شرکت مادر", max: 20 },
    { key: "isActive", label: "وضعیت فعال", max: 20 },
  ],
};
export function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
export function validateImportRow(
  target: ImportTarget,
  row: ImportRow,
  mapping: Record<string, string>,
  parents: number[],
) {
  const data: Record<string, string | number | boolean> = {};
  const errors: string[] = [];
  for (const field of importFields[target]) {
    const value = (row[mapping[field.key]] ?? "").trim();
    if (!value) {
      errors.push(`${field.label} الزامی است`);
      continue;
    }
    if (field.key === "isActive") {
      const normalized = normalizeDigits(value).toLowerCase();
      if (["true", "1", "فعال", "yes"].includes(normalized))
        data.isActive = true;
      else if (["false", "0", "غیرفعال", "غیر فعال", "no"].includes(normalized))
        data.isActive = false;
      else errors.push("وضعیت باید true / false یا فعال / غیرفعال باشد");
    } else if (field.key === "companyId") {
      const n = Number(normalizeDigits(value));
      if (
        !/^\d+$/.test(normalizeDigits(value)) ||
        !Number.isSafeInteger(n) ||
        n < 1 ||
        n > 2147483647 ||
        !parents.includes(n)
      )
        errors.push("شناسه عددی شرکت مادر در سامانه وجود ندارد");
      else data.companyId = n;
    } else if (value.length > field.max)
      errors.push(`${field.label}: حداکثر ${field.max} نویسه`);
    else data[field.key] = value;
  }
  return { data, errors };
}
export function flatRecords(value: unknown): ImportRow[] {
  if (!Array.isArray(value) || !value.length)
    throw new Error("پاسخ باید آرایه‌ای غیرخالی از رکوردها باشد.");
  if (value.length > 500)
    throw new Error("در هر نوبت حداکثر ۵۰۰ ردیف مجاز است.");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new Error("هر رکورد باید یک شیء باشد.");
    const result: ImportRow = {};
    for (const [key, val] of Object.entries(item)) {
      if (val !== null && typeof val === "object")
        throw new Error(
          "ستون‌های تو در تو پشتیبانی نمی‌شوند؛ مسیر آرایه را مشخص کنید.",
        );
      result[key] = val == null ? "" : String(val);
    }
    return result;
  });
}

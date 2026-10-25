"use client";

import { useMemo, useState } from "react";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import { Download, FileSpreadsheet, Globe, Upload, Check } from "lucide-react";
import { FilterSelect, FormAlert } from "@/components/ui/joy-controls";
import { Input } from "@/components/ui/input";
import {
  flatRecords,
  importFields,
  validateImportRow,
  type ImportRow,
  type ImportTarget,
} from "@/lib/import-data";

type Parent = {
  id: number;
  name: string;
  companyID: string;
  companycode: string;
};
type Result = { state: "saved" | "failed" | "unknown"; message: string };
const LIMIT = 5 * 1024 * 1024;
function xmlRows(text: string, tag: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new Error("XML نباید DTD یا ENTITY داشته باشد.");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror"))
    throw new Error("ساختار XML معتبر نیست.");
  const nodes = Array.from(doc.getElementsByTagNameNS("*", tag));
  return flatRecords(
    nodes.map((node) => {
      const entries = Array.from(node.children).map((child) => {
        if (child.children.length)
          throw new Error(
            "فیلدهای XML باید ساده باشند؛ نام عنصر رکورد را بررسی کنید.",
          );
        return [child.localName, child.textContent ?? ""];
      });
      if (new Set(entries.map(([key]) => key)).size !== entries.length)
        throw new Error("نام فیلد تکراری در XML وجود دارد.");
      return Object.fromEntries(entries);
    }),
  );
}
function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ImportCenter() {
  const [target, setTarget] = useState<ImportTarget>("companies");
  const [source, setSource] = useState("excel");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parents, setParents] = useState<Parent[]>([]);
  const [existing, setExisting] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [results, setResults] = useState<Record<number, Result>>({});
  const [attempted, setAttempted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState("1");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [arrayPath, setArrayPath] = useState("");
  const [xmlTag, setXmlTag] = useState("record");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [soapAction, setSoapAction] = useState("");
  const [page, setPage] = useState(1);
  const fields = importFields[target];
  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap(Object.keys))),
    [rows],
  );
  const checked = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((row) => {
      const result = validateImportRow(
        target,
        row,
        mapping,
        parents.map((p) => p.id),
      );
      const d = result.data;
      const keys =
        target === "companies"
          ? [
              `id:${String(d.companyID).toLowerCase()}`,
              `code:${String(d.companycode).toLowerCase()}`,
            ]
          : [`${d.companyId}:${String(d.name).toLowerCase()}`];
      if (!result.errors.length) {
        if (keys.some((key) => seen.has(key)))
          result.errors.push("رکورد تکراری در همین ورودی");
        keys.forEach((key) => seen.add(key));
        const duplicate = existing.some((e) =>
          target === "companies"
            ? String(e.companyID).toLowerCase() ===
                String(d.companyID).toLowerCase() ||
              String(e.companycode).toLowerCase() ===
                String(d.companycode).toLowerCase()
            : e.companyId === d.companyId &&
              String(e.name).toLowerCase() === String(d.name).toLowerCase(),
        );
        if (duplicate)
          result.errors.push(
            "رکورد مشابه از قبل وجود دارد؛ ورود فقط برای ایجاد رکورد جدید است",
          );
      }
      return result;
    });
  }, [rows, mapping, target, parents, existing]);
  const invalid = checked.filter((r) => r.errors.length).length;
  const saved = Object.values(results).filter(
    (r) => r.state === "saved",
  ).length;
  function reset() {
    setRows([]);
    setResults({});
    setAttempted(false);
    setError("");
    setPage(1);
  }
  async function preview() {
    reset();
    setBusy(true);
    try {
      let input: ImportRow[];
      if (source === "excel" || source === "xml") {
        if (!file) throw new Error("ابتدا فایل را انتخاب کنید.");
        if (file.size > LIMIT)
          throw new Error("حداکثر حجم فایل ۵ مگابایت است.");
        if (source === "excel") {
          if (!file.name.toLowerCase().endsWith(".xlsx"))
            throw new Error("فایل اکسل را با پسوند .xlsx ذخیره کنید.");
          const { Workbook } = await import("exceljs");
          const book = new Workbook();
          await book.xlsx.load(await file.arrayBuffer());
          const ws = book.worksheets[Number(sheet) - 1];
          if (!ws) throw new Error("شماره برگه اکسل وجود ندارد.");
          if (ws.rowCount > 501 || ws.columnCount > 100)
            throw new Error("حداکثر ۵۰۰ ردیف داده و ۱۰۰ ستون مجاز است.");
          const headers: string[] = [];
          ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
            headers[col - 1] = cell.text.trim();
          });
          if (
            !headers.length ||
            headers.some((h) => !h) ||
            new Set(headers).size !== headers.length
          )
            throw new Error(
              "ردیف اول باید شامل نام‌های یکتای ستون‌ها و بدون خانه خالی باشد.",
            );
          const records: ImportRow[] = [];
          ws.eachRow((row, n) => {
            if (n === 1) return;
            const record: ImportRow = {};
            headers.forEach((h, i) => {
              const cell = row.getCell(i + 1);
              if (cell.formula)
                throw new Error(
                  "فرمول‌ها را پیش از ورود به مقدار ثابت تبدیل کنید.",
                );
              record[h] = cell.text;
            });
            if (Object.values(record).some((v) => v.trim()))
              records.push(record);
          });
          input = flatRecords(records);
        } else input = xmlRows(await file.text(), xmlTag);
      } else {
        const endpoint = new URL(url);
        if (
          endpoint.username ||
          endpoint.password ||
          !["http:", "https:"].includes(endpoint.protocol)
        )
          throw new Error("نشانی HTTP یا HTTPS معتبر وارد کنید.");
        if (
          token &&
          endpoint.protocol !== "https:" &&
          !["localhost", "127.0.0.1"].includes(endpoint.hostname)
        )
          throw new Error("برای ارسال توکن از HTTPS استفاده کنید.");
        const response = await fetch(endpoint, {
          method: source === "service" ? method : "GET",
          credentials: "omit",
          redirect: "error",
          signal: AbortSignal.timeout(20000),
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(source === "service" && method === "POST"
              ? {
                  "Content-Type": "text/xml; charset=utf-8",
                  ...(soapAction ? { SOAPAction: soapAction } : {}),
                }
              : {}),
          },
          ...(source === "service" && method === "POST" ? { body } : {}),
        });
        if (!response.ok)
          throw new Error(`دریافت داده ناموفق بود (HTTP ${response.status}).`);
        const reader = response.body?.getReader();
        if (!reader) throw new Error("پاسخ سرویس خالی است.");
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.length;
          if (size > LIMIT) {
            await reader.cancel();
            throw new Error("پاسخ بیش از ۵ مگابایت است.");
          }
          chunks.push(chunk.value);
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const text = new TextDecoder().decode(bytes);
        if (source === "service") input = xmlRows(text, xmlTag);
        else {
          let value: unknown = JSON.parse(text);
          for (const key of arrayPath.split(".").filter(Boolean)) {
            if (
              !value ||
              typeof value !== "object" ||
              !Object.hasOwn(value, key)
            )
              throw new Error("مسیر آرایه در پاسخ پیدا نشد.");
            value = (value as Record<string, unknown>)[key];
          }
          input = flatRecords(value);
        }
      }
      const responses = await Promise.all([
        fetch("/api/companies"),
        fetch(`/api/${target}`),
      ]);
      if (responses.some((r) => !r.ok))
        throw new Error(
          "بررسی رکوردهای موجود ناموفق بود؛ اتصال یا ورود به حساب را بررسی کنید.",
        );
      setParents(await responses[0].json());
      setExisting(await responses[1].json());
      const keys = Array.from(new Set(input.flatMap(Object.keys)));
      setMapping(
        Object.fromEntries(
          fields.map((f) => [
            f.key,
            keys.find(
              (k) => k.toLowerCase() === f.key.toLowerCase() || k === f.label,
            ) || "",
          ]),
        ),
      );
      setRows(input);
      setSourceName(
        source === "excel" || source === "xml" ? file!.name : new URL(url).host,
      );
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "دریافت ناموفق بود. نشانی، اتصال و مجوز CORS سرویس را بررسی کنید."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (busy || attempted || invalid || !checked.length) return;
    setBusy(true);
    setAttempted(true);
    setError("");
    for (let i = 0; i < checked.length; i++) {
      try {
        const response = await fetch(`/api/${target}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checked[i].data),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setResults((r) => ({
            ...r,
            [i]: {
              state: "failed",
              message: String(
                payload.error ||
                  payload.detail ||
                  payload.title ||
                  `HTTP ${response.status}`,
              ),
            },
          }));
          setError(
            "ذخیره متوقف شد. ردیف‌های موفق ثبت شده‌اند؛ برای ادامه، خطا را رفع و فقط ردیف‌های باقی‌مانده را دوباره وارد کنید.",
          );
          break;
        }
        setResults((r) => ({
          ...r,
          [i]: { state: "saved", message: "ثبت شد" },
        }));
      } catch {
        setResults((r) => ({
          ...r,
          [i]: {
            state: "unknown",
            message:
              "وضعیت نامشخص؛ پیش از ورود مجدد، فهرست مقصد را بررسی کنید.",
          },
        }));
        setError(
          "ارتباط هنگام ذخیره قطع شد. برای جلوگیری از ثبت تکراری، وضعیت ردیف را در فهرست مقصد بررسی کنید.",
        );
        break;
      }
    }
    setBusy(false);
  }
  async function template() {
    try {
      const sample =
        target === "companies"
          ? ["شرکت نمونه", "تهران", "C-001", "CODE-001", true]
          : ["شرکت تابعه نمونه", parents[0]?.id || 1, true];
      const { Workbook } = await import("exceljs");
      const book = new Workbook();
      const ws = book.addWorksheet("Import");
      ws.addRow(fields.map((f) => f.key));
      ws.addRow(sample);
      ws.columns.forEach((c) => {
        c.width = 25;
      });
      downloadFile(
        `${target}-template.xlsx`,
        new Uint8Array(await book.xlsx.writeBuffer()),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } catch {
      setError("ساخت فایل نمونه ناموفق بود.");
    }
  }
  return (
    <section className="workspace-page import-center">
      <div className="page-heading">
        <div>
          <span className="eyebrow">مدیریت داده‌ها</span>
          <h1>مرکز ورود</h1>
          <p>دریافت، بررسی و ثبت اطلاعات شرکت‌ها و شرکت‌های تابعه</p>
        </div>
        <Button
          variant="outlined"
          startDecorator={<Download size={16} />}
          onClick={() => void template()}
          disabled={busy}
        >
          قالب اکسل
        </Button>
      </div>
      <div className="import-card">
        <h2>۱. مقصد و منبع داده</h2>
        <p>
          فقط رکورد جدید ایجاد می‌شود. ابتدا پیش‌نمایش را بررسی و سپس ثبت را
          تأیید کنید.
        </p>
        <fieldset disabled={busy || attempted} className="import-fields">
          <label>
            مقصد
            <FilterSelect
              label="مقصد ورود"
              value={target}
              onValueChange={(v) => {
                reset();
                setTarget(v as ImportTarget);
              }}
              options={[
                { value: "companies", label: "شرکت‌ها" },
                { value: "subcompanies", label: "شرکت‌های تابعه" },
              ]}
            />
          </label>
          <label>
            نوع منبع
            <FilterSelect
              label="نوع منبع"
              value={source}
              onValueChange={(v) => {
                reset();
                setSource(v);
                setFile(null);
              }}
              options={[
                { value: "excel", label: "فایل اکسل (.xlsx)" },
                { value: "xml", label: "فایل XML" },
                { value: "api", label: "API (JSON)" },
                { value: "service", label: "وب‌سرویس (XML / SOAP)" },
              ]}
            />
          </label>
        </fieldset>
        <fieldset disabled={busy || attempted} className="import-fields">
          {source === "excel" || source === "xml" ? (
            <label className="import-wide">
              <FileSpreadsheet size={20} /> انتخاب فایل (حداکثر ۵ مگابایت و ۵۰۰
              ردیف)
              <Input
                key={source}
                type="file"
                accept={source === "excel" ? ".xlsx" : ".xml"}
                onChange={(e) => {
                  reset();
                  setFile(e.target.files?.[0] || null);
                }}
              />
            </label>
          ) : (
            <>
              <label className="import-wide">
                نشانی سرویس
                <Input
                  dir="ltr"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    reset();
                    setUrl(e.target.value);
                  }}
                  placeholder="https://example.com/api/companies"
                />
              </label>
              <label>
                توکن Bearer (اختیاری)
                <Input
                  type="password"
                  autoComplete="off"
                  value={token}
                  onChange={(e) => {
                    reset();
                    setToken(e.target.value);
                  }}
                />
              </label>
              {source === "api" && (
                <label>
                  مسیر آرایه در JSON (اختیاری)
                  <Input
                    dir="ltr"
                    value={arrayPath}
                    onChange={(e) => {
                      reset();
                      setArrayPath(e.target.value);
                    }}
                    placeholder="data.items"
                  />
                </label>
              )}
              <p className="import-wide">
                درخواست مستقیماً از مرورگر ارسال می‌شود؛ سرویس باید CORS را برای
                این وب‌سایت مجاز کند. توکن ذخیره نمی‌شود. پاسخ صفحه‌بندی‌شده را
                هر بار با نشانی همان صفحه وارد کنید.
              </p>
            </>
          )}
          {source === "excel" && (
            <label>
              شماره برگه
              <Input
                type="number"
                min={1}
                value={sheet}
                onChange={(e) => {
                  reset();
                  setSheet(e.target.value);
                }}
              />
            </label>
          )}
          {(source === "xml" || source === "service") && (
            <label>
              نام عنصر هر رکورد در XML
              <Input
                dir="ltr"
                value={xmlTag}
                onChange={(e) => {
                  reset();
                  setXmlTag(e.target.value);
                }}
                placeholder="record"
              />
            </label>
          )}
          {source === "service" && (
            <>
              <label>
                روش درخواست
                <FilterSelect
                  label="روش درخواست"
                  value={method}
                  onValueChange={(v) => {
                    reset();
                    setMethod(v);
                  }}
                  options={[
                    { value: "GET", label: "GET" },
                    { value: "POST", label: "POST (SOAP 1.1)" },
                  ]}
                />
              </label>
              {method === "POST" && (
                <>
                  <label>
                    SOAPAction (اختیاری)
                    <Input
                      dir="ltr"
                      value={soapAction}
                      onChange={(e) => {
                        reset();
                        setSoapAction(e.target.value);
                      }}
                    />
                  </label>
                  <label className="import-wide">
                    بدنه درخواست خواندن اطلاعات
                    <textarea
                      dir="ltr"
                      rows={5}
                      value={body}
                      onChange={(e) => {
                        reset();
                        setBody(e.target.value);
                      }}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </fieldset>
        <div className="import-actions">
          <Button
            startDecorator={<Globe size={16} />}
            loading={busy && !attempted}
            disabled={busy || attempted}
            onClick={() => void preview()}
          >
            دریافت و پیش‌نمایش
          </Button>
          {attempted && (
            <Button variant="outlined" disabled={busy} onClick={reset}>
              ورود جدید
            </Button>
          )}
        </div>
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      {rows.length > 0 && (
        <>
          <div className="import-card">
            <h2>۲. تطبیق ستون‌ها</h2>
            <p>
              ستون متناظر هر فیلد را انتخاب کنید. وضعیت: true / false، ۱ / ۰ یا
              فعال / غیرفعال.
            </p>
            {target === "subcompanies" && (
              <p>
                شناسه شرکت مادر باید شناسه عددی رکورد موجود باشد؛ مانند{" "}
                {parents
                  .slice(0, 5)
                  .map((p) => `${p.name}: ${p.id}`)
                  .join(" — ")}
                . شناسه تجاری شرکت قابل استفاده نیست.
              </p>
            )}
            <fieldset disabled={busy || attempted} className="import-fields">
              {fields.map((f) => (
                <label key={f.key}>
                  {f.label}
                  <FilterSelect
                    label={f.label}
                    value={mapping[f.key] || ""}
                    placeholder="انتخاب ستون"
                    onValueChange={(v) => {
                      setMapping((m) => ({ ...m, [f.key]: v }));
                      setPage(1);
                    }}
                    options={columns.map((c) => ({ value: c, label: c }))}
                  />
                </label>
              ))}
            </fieldset>
          </div>
          <div className="import-card">
            <div className="import-actions">
              <h2>۳. پیش‌نمایش و ثبت</h2>
              <Chip color={invalid ? "danger" : "success"}>
                {rows.length} ردیف · {invalid} خطا · {saved} ثبت‌شده
              </Chip>
            </div>
            <p>
              منبع: {sourceName} — فقط پس از رفع تمام خطاها ثبت فعال می‌شود.
            </p>
            <div className="table-scroll">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    {fields.map((f) => (
                      <th key={f.key}>{f.label}</th>
                    ))}
                    <th>نتیجه بررسی</th>
                  </tr>
                </thead>
                <tbody>
                  {checked.slice((page - 1) * 20, page * 20).map((r, j) => {
                    const i = (page - 1) * 20 + j;
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        {fields.map((f) => (
                          <td key={f.key}>{rows[i][mapping[f.key]] || "—"}</td>
                        ))}
                        <td>
                          {results[i]?.message ||
                            r.errors.join("؛ ") ||
                            (attempted ? "ثبت نشده" : "آماده ثبت")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="import-actions">
              <Button
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                قبلی
              </Button>
              <span>
                {page} / {Math.ceil(rows.length / 20)}
              </span>
              <Button
                variant="outlined"
                disabled={page * 20 >= rows.length}
                onClick={() => setPage(page + 1)}
              >
                بعدی
              </Button>
            </div>
            <div className="import-actions">
              <Button
                startDecorator={<Upload size={16} />}
                loading={busy && attempted}
                disabled={busy || attempted || invalid > 0}
                onClick={() => void save()}
              >
                تأیید و ثبت {rows.length} ردیف
              </Button>
              <Button
                variant="outlined"
                startDecorator={<Download size={16} />}
                onClick={() =>
                  downloadFile(
                    "import-results.json",
                    JSON.stringify(
                      checked.map((r, i) => ({
                        row: i + 1,
                        data: r.data,
                        errors: r.errors,
                        result: results[i] || { state: "not-saved" },
                      })),
                      null,
                      2,
                    ),
                    "application/json",
                  )
                }
              >
                دانلود نتیجه بررسی
              </Button>
            </div>
            {saved === rows.length && (
              <p role="status">
                <Check size={16} /> همه ردیف‌ها با موفقیت ثبت شدند.
              </p>
            )}
            <p>
              ثبت به‌صورت ردیفی انجام می‌شود؛ در صورت خطا، ردیف‌های موفق حفظ
              می‌شوند و ادامه ثبت متوقف می‌شود.
            </p>
          </div>
        </>
      )}
      <details className="import-card">
        <summary>راهنمای ساختار فایل و سرویس</summary>
        <p>
          اکسل: ردیف اول نام ستون‌ها؛ فایل .xls را ابتدا به .xlsx تبدیل کنید.
          شناسه‌های دارای صفر ابتدایی را به‌صورت متن ذخیره کنید.
        </p>
        <p>
          API: آرایه JSON از رکوردهای ساده یا آرایه در مسیر مشخص‌شده. وب‌سرویس:
          XML یا SOAP 1.1 با عنصر رکورد مشخص. دریافت خودکار همه صفحات و احراز
          هویت OAuth در این نسخه پشتیبانی نمی‌شود.
        </p>
        <pre dir="ltr">
          {target === "companies"
            ? "<records><record><name>Sample</name><address>Tehran</address><companyID>C-001</companyID><companycode>CODE-001</companycode><isActive>true</isActive></record></records>"
            : "<records><record><name>Branch</name><companyId>1</companyId><isActive>true</isActive></record></records>"}
        </pre>
      </details>
    </section>
  );
}

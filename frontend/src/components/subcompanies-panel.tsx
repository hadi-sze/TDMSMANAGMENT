"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Table from "@mui/joy/Table";
import Chip from "@mui/joy/Chip";
import Switch from "@mui/joy/Switch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterSelect, FormAlert } from "@/components/ui/joy-controls";
import { OrbitRing } from "@/components/orbit-ring";
import type { Company } from "@/lib/companies";
import type { SubCompany } from "@/lib/subcompanies";

type Fields = Omit<SubCompany, "id">;
const empty: Fields = { name: "", companyId: 0, isActive: true };
async function errorMessage(response: Response) {
  try {
    const body = await response.json();
    return (
      body.error ||
      (body.errors && Object.values(body.errors).flat()[0]) ||
      body.detail ||
      body.title ||
      "امکان انجام درخواست وجود ندارد."
    );
  } catch {
    return "درخواست انجام نشد. دوباره تلاش کنید.";
  }
}

export function SubCompaniesPanel({ mode }: { mode: "api" | "demo" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [items, setItems] = useState<SubCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [parentFilter, setParentFilter] = useState(
    params.get("companyId") || "all",
  );
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ item?: SubCompany } | null>(null);
  const [fields, setFields] = useState<Fields>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<SubCompany | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [children, parents] = await Promise.all([
        fetch("/api/subcompanies", { cache: "no-store" }),
        fetch("/api/companies", { cache: "no-store" }),
      ]);
      if (children.status === 401 || parents.status === 401) {
        router.push("/login");
        return;
      }
      if (!children.ok) throw new Error(await errorMessage(children));
      if (!parents.ok) throw new Error(await errorMessage(parents));
      setItems(await children.json());
      setCompanies(await parents.json());
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const parent = params.get("companyId");
    setParentFilter(parent || "all");
    setPage(1);
    if (params.get("new") === "1") {
      setEditor({});
      setFormError("");
      setFields({
        ...empty,
        companyId:
          parent && Number.isSafeInteger(Number(parent)) ? Number(parent) : 0,
      });
      router.replace(
        `/dashboard/subcompanies${parent ? `?companyId=${encodeURIComponent(parent)}` : ""}`,
        { scroll: false },
      );
    }
  }, [params, router]);

  const parentsById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );
  const parentOptions = useMemo(
    () =>
      [...companies]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((company) => ({
          value: String(company.id),
          label: `${company.name} · #${company.id}`,
        })),
    [companies],
  );
  const filtered = useMemo(
    () =>
      items
        .filter(
          (item) =>
            `${item.name} ${parentsById.get(item.companyId)?.name || ""} ${item.companyId}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (status === "all" ||
              (status === "active" ? item.isActive : !item.isActive)) &&
            (parentFilter === "all" || String(item.companyId) === parentFilter),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, query, status, parentFilter, parentsById],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const active = items.filter((item) => item.isActive).length;

  function openEditor(item?: SubCompany) {
    setEditor({ item });
    setFormError("");
    setFields(
      item
        ? {
            name: item.name,
            companyId: item.companyId,
            isActive: item.isActive,
          }
        : {
            ...empty,
            companyId: parentFilter !== "all" ? Number(parentFilter) : 0,
          },
    );
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    if (!fields.name.trim()) {
      setFormError("نام شرکت تابعه را وارد کنید.");
      return;
    }
    if (!parentsById.has(fields.companyId)) {
      setFormError("یک شرکت مادر موجود را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(
        editor.item
          ? `/api/subcompanies/${editor.item.id}`
          : "/api/subcompanies",
        {
          method: editor.item ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );
      if (!response.ok) {
        setFormError(await errorMessage(response));
        return;
      }
      toast.success(
        editor.item ? "شرکت تابعه به‌روزرسانی شد" : "شرکت تابعه اضافه شد",
      );
      setEditor(null);
      await refresh();
    } catch {
      setFormError("شرکت تابعه ذخیره نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/subcompanies/${deleting.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await errorMessage(response));
        return;
      }
      toast.success("شرکت تابعه حذف شد");
      setDeleting(null);
      await refresh();
    } catch {
      toast.error("شرکت تابعه حذف نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="workspace-page companies-page">
      <div className="page-heading">
        <div>
          <span className="section-eyebrow">سازمان‌های شما</span>
          <h1>شرکت‌های تابعه</h1>
          <p>شعبه‌ها و شرکت‌های تابعه مرتبط با شرکت مادر.</p>
        </div>
        <Button
          disabled={loading || !!error || companies.length === 0}
          onClick={() => openEditor()}
        >
          <Plus /> افزودن شرکت تابعه
        </Button>
      </div>
      <div className="stats-grid company-stats">
        <div className="stat-card">
          <div>
            <span>تعداد شرکت‌های تابعه</span>
            <Building2 size={16} />
          </div>
          <strong>{loading ? "—" : items.length}</strong>
          <p>در تمام شرکت‌های شما</p>
        </div>
        <div className="stat-card">
          <div>
            <span>شرکت‌های تابعه فعال</span>
            <Check size={16} />
          </div>
          <strong>{loading ? "—" : active}</strong>
          <p>آماده برای فعالیت</p>
        </div>
        <div className="stat-card">
          <div>
            <span>شرکت‌های مادر</span>
            <Building2 size={16} />
          </div>
          <strong>{loading ? "—" : companies.length}</strong>
          <p>قابل انتخاب به‌عنوان شرکت مادر</p>
        </div>
      </div>
      <div className="catalog-panel">
        <div className="catalog-toolbar subcompany-toolbar">
          <div className="catalog-search">
            <Search size={16} />
            <Input
              aria-label="جستجوی شرکت‌های تابعه"
              placeholder="جستجوی شرکت‌های تابعه…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="catalog-toolbar-right subcompany-filters">
            <FilterSelect
              label="فیلتر شرکت مادر"
              value={parentFilter}
              onValueChange={(value) => {
                setParentFilter(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: "همه شرکت‌ها" },
                ...parentOptions,
              ]}
            />
            <FilterSelect
              label="فیلتر وضعیت شرکت تابعه"
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: "همه وضعیت‌ها" },
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
            />
          </div>
        </div>
        {error ? (
          <div className="empty-state" role="alert">
            <Building2 size={28} />
            <h3>اتصال را دوباره برقرار کنید.</h3>
            <p>{error}</p>
            <Button variant="outline" onClick={() => void refresh()}>
              تلاش دوباره
            </Button>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <OrbitRing className="size-6 text-primary" />
            <span>در حال بارگذاری شرکت‌های تابعه…</span>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              {rows.length ? (
                <Table
                  hoverRow
                  size="sm"
                  className="product-table subcompany-table"
                >
                  <thead>
                    <tr>
                      <th>نام شرکت تابعه</th>
                      <th>شرکت مادر</th>
                      <th>شناسه شرکت</th>
                      <th>وضعیت</th>
                      <th>
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.id}>
                        <td data-label="نام شرکت تابعه">
                          <button
                            className="product-name"
                            onClick={() => openEditor(item)}
                          >
                            <span className="product-thumb">
                              <Building2 size={19} />
                            </span>
                            <span>
                              <strong dir="auto">{item.name}</strong>
                              <small className="record-id">
                                شناسه: <bdi>{item.id}</bdi>
                              </small>
                            </span>
                          </button>
                        </td>
                        <td data-label="شرکت مادر">
                          <Link href={`/dashboard/companies`}>
                            <bdi>
                              {parentsById.get(item.companyId)?.name ||
                                `شرکت شماره ${item.companyId}`}
                            </bdi>
                          </Link>
                        </td>
                        <td data-label="شناسه شرکت مادر">
                          <bdi>{item.companyId}</bdi>
                        </td>
                        <td data-label="وضعیت">
                          <Chip
                            color={item.isActive ? "success" : "neutral"}
                            size="sm"
                            variant="soft"
                          >
                            {item.isActive ? "فعال" : "غیرفعال"}
                          </Chip>
                        </td>
                        <td data-label="عملیات">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`عملیات ${item.name}`}
                              >
                                <Ellipsis />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => openEditor(item)}
                              >
                                <Pencil /> ویرایش شرکت تابعه
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:bg-red-50"
                                onSelect={() => setDeleting(item)}
                              >
                                <Trash2 /> حذف شرکت تابعه
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="empty-state">
                  <Building2 size={30} />
                  <h3>
                    {companies.length === 0
                      ? "ابتدا یک شرکت مادر اضافه کنید"
                      : items.length
                        ? "شرکت تابعه‌ای مطابق جستجو پیدا نشد"
                        : "فهرست شرکت‌های تابعه شما از اینجا آغاز می‌شود"}
                  </h3>
                  <p>
                    {companies.length === 0
                      ? "هر شرکت تابعه باید به یک شرکت موجود مرتبط باشد."
                      : items.length
                        ? "جستجو، شرکت یا فیلتر وضعیت را تغییر دهید."
                        : "یک شعبه یا شرکت تابعه اضافه و شرکت مادر آن را انتخاب کنید."}
                  </p>
                  {companies.length === 0 ? (
                    <Button asChild variant="outline">
                      <Link href="/dashboard/companies?new=1">افزودن شرکت</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() =>
                        items.length
                          ? (setQuery(""),
                            setStatus("all"),
                            setParentFilter("all"),
                            setPage(1))
                          : openEditor()
                      }
                    >
                      {items.length
                        ? "پاک کردن فیلترها"
                        : "افزودن اولین شرکت تابعه"}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                {filtered.length
                  ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)}`
                  : "0"}{" "}
                از {filtered.length} شرکت تابعه
              </span>
              <div>
                <span>
                  {currentPage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="صفحه قبلی شرکت‌های تابعه"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="صفحه بعدی شرکت‌های تابعه"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="data-source-note">
        <Building2 size={12} />
        {mode === "api"
          ? "شرکت‌های تابعه · متصل به سرویس دات‌نت ۱۰ و پایگاه داده"
          : "شرکت‌های تابعه آزمایشی · تغییرات روی این سرور ذخیره می‌شوند"}
      </p>
      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open && !saving) setEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <span className="dialog-icon">
              <Building2 size={22} />
            </span>
            <DialogTitle>
              {editor?.item ? "ویرایش شرکت تابعه" : "افزودن شرکت تابعه"}
            </DialogTitle>
            <DialogDescription>
              شرکت مادر را انتخاب و نام شرکت تابعه را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <form className="product-form" onSubmit={save}>
            {editor?.item && (
              <div className="space-y-2">
                <Label htmlFor="subcompany-id">شناسه رکورد</Label>
                <Input
                  id="subcompany-id"
                  value={editor.item.id}
                  readOnly
                  disabled
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="subcompany-name">
                نام شرکت تابعه <span className="required-mark">*</span>
              </Label>
              <Input
                id="subcompany-name"
                dir="auto"
                autoFocus
                required
                maxLength={200}
                placeholder="مثلاً شعبه تهران"
                value={fields.name}
                onChange={(event) =>
                  setFields({ ...fields, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcompany-parent">
                شرکت مادر <span className="required-mark">*</span>
              </Label>
              <FilterSelect
                id="subcompany-parent"
                disablePortal
                label="شرکت مادر"
                placeholder="انتخاب شرکت"
                value={fields.companyId ? String(fields.companyId) : ""}
                onValueChange={(value) =>
                  setFields({ ...fields, companyId: Number(value) })
                }
                options={parentOptions}
              />
              <p className="field-help">
                شناسه شرکت به شناسه عددی شرکت مادر اشاره دارد.
              </p>
            </div>
            <div className="company-active-field">
              <div>
                <Label htmlFor="subcompany-active">شرکت تابعه فعال</Label>
                <p>شرکت‌های تابعه غیرفعال در فهرست شما باقی می‌مانند.</p>
              </div>
              <Switch
                checked={fields.isActive}
                color={fields.isActive ? "primary" : "neutral"}
                slotProps={{
                  input: {
                    id: "subcompany-active",
                    "aria-label": "شرکت تابعه فعال",
                  },
                }}
                onChange={(event) =>
                  setFields({ ...fields, isActive: event.target.checked })
                }
              />
            </div>
            {formError && <FormAlert>{formError}</FormAlert>}
            <div className="dialog-form-footer">
              <Button
                variant="outline"
                type="button"
                disabled={saving}
                onClick={() => setEditor(null)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={saving || companies.length === 0}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
                {editor?.item ? "ذخیره تغییرات" : "ایجاد شرکت تابعه"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !saving) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <span className="dialog-icon destructive-icon">
              <Trash2 size={21} />
            </span>
            <DialogTitle>شرکت تابعه حذف شود؟</DialogTitle>
            <DialogDescription>
              حذف «{deleting?.name}»؟ این کار قابل بازگشت نیست. شرکت مادر باقی
              می‌ماند.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-footer">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setDeleting(null)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void remove()}
            >
              {saving ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{" "}
              حذف شرکت تابعه
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

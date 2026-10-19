"use client";

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
import type { Company } from "@/lib/companies";
import Table from "@mui/joy/Table";
import Chip from "@mui/joy/Chip";
import Switch from "@mui/joy/Switch";
import { OrbitRing } from "@/components/orbit-ring";
import { FilterSelect, FormAlert } from "@/components/ui/joy-controls";

type Fields = Omit<Company, "id">;
const empty: Fields = {
  name: "",
  address: "",
  companyID: "",
  companycode: "",
  isActive: true,
};
async function message(response: Response) {
  try {
    const body = await response.json();
    return (
      body.error ||
      (body.errors && Object.values(body.errors).flat()[0]) ||
      body.detail ||
      body.title ||
      "ذخیره شرکت انجام نشد."
    );
  } catch {
    return "درخواست انجام نشد. دوباره تلاش کنید.";
  }
}

export function CompaniesPanel({ mode }: { mode: "demo" | "api" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ company?: Company } | null>(null);
  const [fields, setFields] = useState<Fields>(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Company | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/companies", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) throw new Error(await message(response));
      setCompanies(await response.json());
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
    if (params.get("new") === "1") {
      setEditor({});
      setFields({ ...empty });
      setFormError("");
      router.replace("/dashboard/companies", { scroll: false });
    }
  }, [params, router]);

  function openEditor(company?: Company) {
    setEditor({ company });
    setFormError("");
    setFields(
      company
        ? {
            name: company.name,
            address: company.address,
            companyID: company.companyID,
            companycode: company.companycode,
            isActive: company.isActive,
          }
        : { ...empty },
    );
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch(
        editor.company
          ? `/api/companies/${editor.company.id}`
          : "/api/companies",
        {
          method: editor.company ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );
      if (!response.ok) {
        setFormError(await message(response));
        return;
      }
      toast.success(editor.company ? "شرکت به‌روزرسانی شد" : "شرکت اضافه شد");
      setEditor(null);
      await refresh();
    } catch {
      setFormError("شرکت ذخیره نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/companies/${deleting.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await message(response));
        return;
      }
      toast.success("شرکت حذف شد");
      setDeleting(null);
      await refresh();
    } catch {
      toast.error("شرکت حذف نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }
  const filtered = useMemo(
    () =>
      companies
        .filter(
          (company) =>
            `${company.name} ${company.address} ${company.companyID} ${company.companycode}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (status === "all" ||
              (status === "active" ? company.isActive : !company.isActive)),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [companies, query, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const active = companies.filter((company) => company.isActive).length;

  return (
    <section className="workspace-page companies-page">
      <div className="page-heading">
        <div>
          <span className="section-eyebrow">سازمان‌های شما</span>
          <h1>شرکت‌ها</h1>
          <p>اطلاعات شرکت‌ها، منظم و یکپارچه.</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus /> افزودن شرکت
        </Button>
      </div>
      <div className="stats-grid company-stats">
        <div className="stat-card">
          <div>
            <span>تعداد شرکت‌ها</span>
            <Building2 size={16} />
          </div>
          <strong>{loading ? "—" : companies.length}</strong>
          <p>در فضای کاری شما</p>
        </div>
        <div className="stat-card">
          <div>
            <span>شرکت‌های فعال</span>
            <Check size={16} />
          </div>
          <strong>{loading ? "—" : active}</strong>
          <p>آماده برای فعالیت</p>
        </div>
        <div className="stat-card">
          <div>
            <span>شرکت‌های غیرفعال</span>
            <Building2 size={16} />
          </div>
          <strong>{loading ? "—" : companies.length - active}</strong>
          <p>نگهداری‌شده در سوابق</p>
        </div>
      </div>
      <div className="catalog-panel">
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <Search size={16} />
            <Input
              aria-label="جستجوی شرکت‌ها"
              placeholder="جستجوی شرکت‌ها…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="catalog-toolbar-right">
            <FilterSelect
              label="فیلتر وضعیت شرکت"
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
          <div className="loading-state" role="status">
            <OrbitRing className="size-6 text-primary" />
            در حال بارگذاری شرکت‌ها…
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <Table hoverRow size="sm" className="product-table company-table">
                <thead>
                  <tr>
                    <th>نام شرکت</th>
                    <th>شناسه شرکت</th>
                    <th>کد شرکت</th>
                    <th>نشانی</th>
                    <th>وضعیت</th>
                    <th>
                      <span className="sr-only">عملیات</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((company) => (
                    <tr key={company.id}>
                      <td data-label="نام شرکت">
                        <button
                          className="product-name"
                          onClick={() => openEditor(company)}
                        >
                          <span className="product-thumb">
                            <Building2 size={19} />
                          </span>
                          <span>
                            <strong dir="auto">{company.name}</strong>
                            <small className="record-id">
                              شناسه: {company.id}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td data-label="شناسه شرکت">
                        <bdi>{company.companyID}</bdi>
                      </td>
                      <td data-label="کد شرکت">
                        <code>
                          <bdi>{company.companycode}</bdi>
                        </code>
                      </td>
                      <td
                        className="company-address"
                        title={company.address}
                        data-label="نشانی"
                      >
                        <span dir="auto">{company.address}</span>
                      </td>
                      <td data-label="وضعیت">
                        <Chip
                          color={company.isActive ? "success" : "neutral"}
                          variant="soft"
                          size="sm"
                        >
                          {company.isActive ? "فعال" : "غیرفعال"}
                        </Chip>
                      </td>
                      <td data-label="عملیات">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`عملیات ${company.name}`}
                            >
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => openEditor(company)}
                            >
                              <Pencil /> ویرایش شرکت
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                router.push(
                                  `/dashboard/subcompanies?companyId=${company.id}`,
                                )
                              }
                            >
                              <Building2 /> مشاهده شرکت‌های تابعه
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                router.push(
                                  `/dashboard/subcompanies?companyId=${company.id}&new=1`,
                                )
                              }
                            >
                              <Plus /> افزودن شرکت تابعه
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-red-50"
                              onSelect={() => setDeleting(company)}
                            >
                              <Trash2 /> حذف شرکت
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!rows.length && (
                <div className="empty-state">
                  <Building2 size={32} />
                  <h3>
                    {companies.length
                      ? "شرکتی مطابق جستجو پیدا نشد"
                      : "فهرست شرکت‌های شما از اینجا آغاز می‌شود"}
                  </h3>
                  <p>
                    {companies.length
                      ? "جستجو یا فیلتر وضعیت را تغییر دهید."
                      : "یک شرکت با نشانی، شناسه‌ها و وضعیت فعالیت اضافه کنید."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      companies.length
                        ? (setQuery(""), setStatus("all"))
                        : openEditor()
                    }
                  >
                    {companies.length
                      ? "پاک کردن فیلترها"
                      : "افزودن اولین شرکت"}
                  </Button>
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                {filtered.length
                  ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)}`
                  : "0"}{" "}
                از {filtered.length} شرکت
              </span>
              <div>
                <span>
                  {currentPage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="صفحه قبلی شرکت‌ها"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="صفحه بعدی شرکت‌ها"
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
        {mode === "demo"
          ? "شرکت‌های آزمایشی · تغییرات روی این سرور ذخیره می‌شوند"
          : "شرکت‌ها · متصل به سرویس دات‌نت ۱۰ و پایگاه داده"}
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
              <Building2 size={20} />
            </span>
            <DialogTitle>
              {editor?.company ? "ویرایش شرکت" : "افزودن شرکت"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات شرکت را وارد کنید. تکمیل همه فیلدهای متنی الزامی است.
            </DialogDescription>
          </DialogHeader>
          <form className="product-form" onSubmit={save}>
            {editor?.company && (
              <div className="space-y-2">
                <Label htmlFor="company-record-id">شناسه رکورد</Label>
                <Input
                  id="company-record-id"
                  value={editor.company.id}
                  readOnly
                  disabled
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="company-name">
                نام شرکت <span className="required-mark">*</span>
              </Label>
              <Input
                id="company-name"
                dir="auto"
                autoFocus
                required
                maxLength={200}
                placeholder="مثلاً شرکت نمونه"
                value={fields.name}
                onChange={(event) =>
                  setFields({ ...fields, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">
                نشانی <span className="required-mark">*</span>
              </Label>
              <textarea
                id="company-address"
                dir="auto"
                required
                maxLength={500}
                rows={3}
                placeholder="خیابان، شهر، استان، کد پستی"
                value={fields.address}
                onChange={(event) =>
                  setFields({ ...fields, address: event.target.value })
                }
              />
            </div>
            <div className="form-two-columns">
              <div className="space-y-2">
                <Label htmlFor="company-identifier">
                  شناسه شرکت <span className="required-mark">*</span>
                </Label>
                <Input
                  id="company-identifier"
                  dir="auto"
                  required
                  maxLength={100}
                  placeholder="مثلاً CMP-001"
                  value={fields.companyID}
                  onChange={(event) =>
                    setFields({ ...fields, companyID: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-code">
                  کد شرکت <span className="required-mark">*</span>
                </Label>
                <Input
                  id="company-code"
                  dir="auto"
                  required
                  maxLength={50}
                  placeholder="مثلاً ACME"
                  value={fields.companycode}
                  onChange={(event) =>
                    setFields({ ...fields, companycode: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="company-active-field">
              <div>
                <Label htmlFor="company-active">شرکت فعال</Label>
                <p>شرکت‌های غیرفعال در فهرست شما باقی می‌مانند.</p>
              </div>
              <Switch
                slotProps={{
                  input: {
                    id: "company-active",
                    "aria-label": "شرکت فعال",
                  },
                }}
                color={fields.isActive ? "primary" : "neutral"}
                checked={fields.isActive}
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
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
                {editor?.company ? "ذخیره تغییرات" : "ایجاد شرکت"}
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
              <Trash2 size={20} />
            </span>
            <DialogTitle>این شرکت حذف شود؟</DialogTitle>
            <DialogDescription>
              “{deleting?.name}» حذف خواهد شد. این کار قابل بازگشت نیست. برای
              نگهداری سوابق، می‌توانید به‌جای حذف، شرکت را غیرفعال کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-footer">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setDeleting(null)}
            >
              نگهداری شرکت
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void remove()}
            >
              {saving && <LoaderCircle className="animate-spin" />}حذف شرکت
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

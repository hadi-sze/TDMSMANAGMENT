"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Box,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Clock3,
  Database,
  Download,
  Ellipsis,
  Eye,
  Folder,
  Home,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MousePointer2,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import Table from "@mui/joy/Table";
import Chip from "@mui/joy/Chip";
import { OrbitRing } from "@/components/orbit-ring";
import { FilterSelect, FormAlert } from "@/components/ui/joy-controls";
import { Brand } from "@/components/brand";
import { SubCompaniesPanel } from "@/components/subcompanies-panel";
import { CompaniesPanel } from "@/components/companies-panel";
import { NavCollapse } from "@/components/ui/nav-collapse";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

type View =
  "home" | "products" | "companies" | "subcompanies" | "analytics" | "settings";
type ProductFields = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
};
const emptyFields: ProductFields = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "",
};
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
const number = (value: number) => new Intl.NumberFormat("en-US").format(value);
const route = (view: View) =>
  view === "home" ? "/dashboard" : `/dashboard/${view}`;
const titleFor: Record<View, string> = {
  home: "صفحه اصلی",
  products: "محصولات",
  companies: "شرکت‌ها",
  subcompanies: "شرکت‌های تابعه",
  analytics: "تحلیل موجودی",
  settings: "تنظیمات حساب کاربری",
};

async function errorMessage(response: Response) {
  try {
    const body = await response.json();
    return (
      body.error ||
      (body.errors && (Object.values(body.errors).flat()[0] as string)) ||
      body.detail ||
      body.title ||
      "خطایی رخ داد. دوباره تلاش کنید."
    );
  } catch {
    return "خطایی رخ داد. دوباره تلاش کنید.";
  }
}

export function Dashboard({
  view,
  email,
  mode,
}: {
  view: View;
  email: string;
  mode: "demo" | "api";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(
    view === "companies" || view === "subcompanies",
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [help, setHelp] = useState<
    "support" | "guide" | "status" | "privacy" | null
  >(null);
  const [editor, setEditor] = useState<{ product?: Product } | null>(null);
  const [fields, setFields] = useState<ProductFields>(emptyFields);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState(searchParams.get("stock") || "all");
  const [sort, setSort] = useState<{
    field: "name" | "price" | "stockQuantity";
    ascending: boolean;
  }>({ field: "name", ascending: true });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) throw new Error(await errorMessage(response));
      setProducts(await response.json());
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    setStock(searchParams.get("stock") || "all");
    setPage(1);
  }, [searchParams]);
  useEffect(() => {
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    if (view === "companies" || view === "subcompanies") setCompaniesOpen(true);
  }, [view]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);

  function openEditor(product?: Product) {
    setMobile(false);
    setFields(
      product
        ? {
            name: product.name,
            description: product.description || "",
            price: String(product.price),
            stockQuantity: String(product.stockQuantity),
          }
        : emptyFields,
    );
    setFormError("");
    setEditor({ product });
    setDetail(null);
  }
  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setFormError("");
    setSaving(true);
    try {
      const response = await fetch(
        editor.product ? `/api/products/${editor.product.id}` : "/api/products",
        {
          method: editor.product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fields.name,
            description: fields.description || null,
            price: Number(fields.price),
            stockQuantity: Number(fields.stockQuantity),
          }),
        },
      );
      if (!response.ok) {
        setFormError(await errorMessage(response));
        return;
      }
      toast.success(
        editor.product ? "محصول به‌روزرسانی شد" : "محصول به فضای کاری اضافه شد",
      );
      setEditor(null);
      await refresh();
    } catch {
      setFormError("محصول ذخیره نشد. اتصال را بررسی و دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }
  async function deleteProduct() {
    if (!deleting) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${deleting.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await errorMessage(response));
        return;
      }
      toast.success("محصول حذف شد");
      setDeleting(null);
      await refresh();
    } catch {
      toast.error("محصول حذف نشد. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("خروج انجام نشد. دوباره تلاش کنید.");
    }
  }
  function exportProducts() {
    const escape = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      ["شناسه", "نام", "توضیحات", "قیمت", "موجودی", "زمان ایجاد (UTC)"],
      ...filtered.map((p) => [
        p.id,
        p.name,
        p.description,
        p.price,
        p.stockQuantity,
        p.createdAtUtc,
      ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "tdms-products.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("خروجی محصولات دانلود شد");
  }
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            `${p.name} ${p.description || ""}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (stock === "all" ||
              (stock === "low"
                ? p.stockQuantity > 0 && p.stockQuantity < 10
                : stock === "out"
                  ? p.stockQuantity === 0
                  : p.stockQuantity >= 10)),
        )
        .sort(
          (a, b) =>
            (typeof a[sort.field] === "string"
              ? String(a[sort.field]).localeCompare(String(b[sort.field]))
              : Number(a[sort.field]) - Number(b[sort.field])) *
            (sort.ascending ? 1 : -1),
        ),
    [products, query, stock, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const units = products.reduce((total, p) => total + p.stockQuantity, 0);
  const value = products.reduce(
    (total, p) => total + p.price * p.stockQuantity,
    0,
  );
  const low = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity < 10,
  ).length;
  const out = products.filter((p) => p.stockQuantity === 0).length;
  const searchProducts = products
    .filter((p) => p.name.toLowerCase().includes(commandQuery.toLowerCase()))
    .slice(0, 5);
  const searchViews = (Object.keys(titleFor) as View[]).filter((key) =>
    titleFor[key].toLowerCase().includes(commandQuery.toLowerCase()),
  );
  const sortedValues = [...products]
    .sort((a, b) => b.price * b.stockQuantity - a.price * a.stockQuantity)
    .slice(0, 6);

  const sidebarContents = (
    <>
      <div className="sidebar-head">
        <Link href="/dashboard" aria-label="صفحه اصلی TDMSMANAGMENT">
          <Brand compact />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="workspace-switch">
              <span>
                <strong>فضای کاری TDMS</strong>
                <small>TDMSMANAGMENT</small>
              </span>
              <ChevronsUpDown size={13} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>فضای کاری شما</DropdownMenuLabel>
            <DropdownMenuLabel>
              <bdi dir="ltr">{email}</bdi>
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
              <Check /> فضای کاری TDMS
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard/settings")}
            >
              <Settings2 /> تنظیمات فضای کاری
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="sidebar-body">
        <button className="quick-search" onClick={() => setCommandOpen(true)}>
          <Search size={14} />
          <span>جستجوی سریع…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav aria-label="ناوبری اصلی">
          <Link
            href="/dashboard"
            className={cn("nav-item", view === "home" && "active")}
          >
            <Home />
            <span>صفحه اصلی</span>
          </Link>

          <Link
            href="/dashboard/products"
            className={cn("nav-item", view === "products" && "active")}
          >
            <Package />
            <span>محصولات</span>
            <span className="nav-count">{loading ? "–" : products.length}</span>
          </Link>
          <button
            className={cn(
              "nav-item",
              (view === "companies" || view === "subcompanies") && "active",
            )}
            aria-label="منوی شرکت‌ها"
            aria-expanded={companiesOpen && !collapsed}
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setCompaniesOpen(true);
              } else setCompaniesOpen(!companiesOpen);
            }}
          >
            <Building2 />
            <span>شرکت‌ها</span>
            <ChevronRight
              className={cn("nav-chevron", companiesOpen && "rotate-90")}
            />
          </button>
          <NavCollapse open={companiesOpen && !collapsed}>
            <ul
              className="recent-list company-navigation"
              aria-label="ناوبری شرکت‌ها"
            >
              <li>
                <Link
                  href="/dashboard/companies"
                  aria-current={
                    view === "companies" && !searchParams.has("new")
                      ? "page"
                      : undefined
                  }
                >
                  <Building2 size={12} />
                  همه شرکت‌ها
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard/subcompanies"
                  aria-current={view === "subcompanies" ? "page" : undefined}
                >
                  <Building2 size={13} />
                  <span>شرکت‌های تابعه</span>
                </Link>
              </li>
            </ul>
          </NavCollapse>
          <Link
            href="/dashboard/analytics"
            className={cn("nav-item", view === "analytics" && "active")}
          >
            <Activity />
            <span>نمای کلی و بینش‌ها</span>
            <span className="new-tag">جدید</span>
            <ChevronRight className="nav-chevron" />
          </Link>
          <div className="nav-label">ایجاد و مدیریت</div>
          <button className="nav-item" onClick={() => openEditor()}>
            <Box />
            <span>ایجاد محصول</span>
            <Plus className="nav-chevron" />
          </button>
          <button
            className="nav-item"
            aria-expanded={inventoryOpen && !collapsed}
            aria-label="موجودی"
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setInventoryOpen(true);
              } else setInventoryOpen(!inventoryOpen);
            }}
          >
            <Layers3 />
            <span>موجودی</span>
            <ChevronRight
              className={cn("nav-chevron", inventoryOpen && "rotate-90")}
            />
          </button>
          <NavCollapse open={inventoryOpen && !collapsed}>
            <div className="recent-list inventory-subnav">
              <Link href="/dashboard/products">همه محصولات</Link>
              <Link href="/dashboard/products?stock=low">موجودی کم</Link>
              <Link href="/dashboard/products?stock=out">ناموجود</Link>
            </div>
          </NavCollapse>

          <button
            className="nav-item"
            onClick={exportProducts}
            disabled={loading || !!loadError}
          >
            <Database />
            <span>داده‌ها و خروجی‌ها</span>
            <Download className="nav-chevron" />
          </button>
          <div className="nav-label">امنیت و اتصال</div>
          <Link href="/dashboard/settings" className="nav-item">
            <ShieldCheck />
            <span>دسترسی و امنیت</span>
            <ChevronRight className="nav-chevron" />
          </Link>
          <button className="nav-item" onClick={() => setHelp("guide")}>
            <BookOpen />
            <span>شروع کار</span>
            <ArrowUpRight className="nav-chevron" />
          </button>
          <div className="sidebar-account">
            <Link
              href="/dashboard/settings"
              className={cn("nav-item", view === "settings" && "active")}
            >
              <Settings2 />
              <span>مدیریت حساب کاربری</span>
              <ChevronRight className="nav-chevron" />
            </Link>
          </div>
        </nav>
      </div>
      <div className="sidebar-foot">
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setMobile(false);
          }}
          aria-label={collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
        <span>
          <span className="status-dot" />{" "}
          {mode === "demo" ? "فضای کاری آزمایشی" : "متصل به دات‌نت"}
        </span>
      </div>
    </>
  );

  return (
    <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
      <a className="skip-link" href="#main-content">
        رفتن به محتوای اصلی
      </a>
      <aside className="sidebar desktop-sidebar">{sidebarContents}</aside>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="mobile-nav-dialog">
          <DialogHeader className="sr-only">
            <DialogTitle>ناوبری فضای کاری</DialogTitle>
            <DialogDescription>
              بخش موردنظر را در فضای کاری TDMSMANAGMENT انتخاب کنید.
            </DialogDescription>
          </DialogHeader>
          <aside className="sidebar mobile-sidebar">{sidebarContents}</aside>
        </DialogContent>
      </Dialog>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="باز کردن منو"
              onClick={() => {
                setCollapsed(false);
                setMobile(true);
              }}
            >
              <Menu />
            </Button>
            <span className="breadcrumb">
              فضای کاری <ChevronRight size={12} />
              <span>{titleFor[view]}</span>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              onClick={() => {
                setHelp("guide");
              }}
            >
              <Sparkles size={14} />
              <span>راهنمای سریع</span>
            </button>
            <button onClick={() => setHelp("support")}>
              <CircleHelp size={14} />
              <span>پشتیبانی</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="user-menu" aria-label="باز کردن منوی کاربر">
                  <UserRound size={17} />
                  <span className="user-status" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>وارد شده با حساب</DropdownMenuLabel>
                <DropdownMenuLabel className="text-foreground">
                  <bdi dir="ltr">{email}</bdi>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => router.push("/dashboard/settings")}
                >
                  <Settings2 /> تنظیمات حساب کاربری
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void logout()}>
                  <LogOut /> خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
          key={view}
          id="main-content"
          className={cn("page-content", view === "home" && "home-content")}
        >
          {view === "home" && (
            <section className="home-view">
              <button
                className="intro-pill"
                onClick={() => router.push("/dashboard/analytics")}
              >
                <span className="intro-spark">
                  <Sparkles size={13} />
                </span>
                نمایی روشن‌تر از فضای کاری شما
                <ArrowUpRight size={13} />
              </button>
              <h1>از همان‌جا که بودید ادامه دهید.</h1>
              <p className="home-subtitle">
                همه چیز در جای خود؛ آماده برای قدم بعدی.
              </p>
              <button
                className="hero-search"
                onClick={() => {
                  setCommandQuery("");
                  setCommandOpen(true);
                }}
              >
                <Search size={19} />
                <span>جستجو در فضای کاری…</span>
                <span className="shortcut">
                  <kbd>Ctrl</kbd>
                  <kbd>K</kbd>
                </span>
              </button>
              <div className="launch-grid">
                <article className="launch-card">
                  <div
                    className="card-illustration folder-illustration"
                    aria-hidden="true"
                  >
                    <div className="dashed-frame" />
                    <div className="folder-shadow" />
                    <div className="folder-back" />
                    <div className="folder-front">
                      <Folder size={27} strokeWidth={1} />
                    </div>
                    <MousePointer2 className="folder-cursor" />
                    <span className="illustration-caption">
                      قدمی کوچک، فرصتی تازه.
                    </span>
                    <div className="art-plus art-plus-one">+</div>
                    <div className="art-plus art-plus-two">+</div>
                  </div>
                  <div className="launch-card-body">
                    <span className="card-kicker">شروعی تازه</span>
                    <h2>چیز تازه‌ای بسازید</h2>
                    <p>
                      محصول تازه‌ای به فضای کاری اضافه کنید. اطلاعات آن را وارد
                      کنید و کار را آغاز کنید.
                    </p>
                    <Button variant="outline" onClick={() => openEditor()}>
                      <Plus /> افزودن محصول
                    </Button>
                  </div>
                </article>
                <article className="launch-card">
                  <div
                    className="card-illustration records-illustration"
                    aria-hidden="true"
                  >
                    <div className="record-line line-one">
                      <span />
                      <i />
                      <b />
                      <Plus />
                    </div>
                    <div className="record-line line-two">
                      <span />
                      <i />
                      <b />
                      <Check />
                    </div>
                    <div className="record-line line-three">
                      <span />
                      <i />
                      <b />
                      <Plus />
                    </div>
                    <div className="record-skeleton">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="records-orbit" />
                  </div>
                  <div className="launch-card-body">
                    <span className="card-kicker">همه چیز منظم</span>
                    <h2>همه چیز در یک جا</h2>
                    <p>
                      محصولات را پیدا کنید، موجودی را زیر نظر بگیرید و فهرستی
                      روشن و منظم داشته باشید.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/products")}
                    >
                      مشاهده محصولات <ArrowRight />
                    </Button>
                  </div>
                </article>
                <article className="launch-card">
                  <div
                    className="card-illustration security-illustration"
                    aria-hidden="true"
                  >
                    <div className="security-line top" />
                    <div className="security-window">
                      <div className="security-window-top">
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="security-lock">
                        <LockKeyhole size={29} strokeWidth={1.6} />
                        <span>
                          <Check size={11} />
                        </span>
                      </div>
                    </div>
                    <div className="security-line bottom" />
                    <span className="security-star star-one">✦</span>
                    <span className="security-star star-two">✦</span>
                  </div>
                  <div className="launch-card-body">
                    <span className="card-kicker">متناسب با نیاز شما</span>
                    <h2>فضای کاری امن شما</h2>
                    <p>
                      اطلاعات حساب و اتصال را در یک جا مدیریت کنید و با آسودگی
                      کار کنید.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/settings")}
                    >
                      تنظیمات حساب کاربری <ArrowRight />
                    </Button>
                  </div>
                </article>
              </div>
              <div className="home-note">
                <span className="status-dot" />
                <span>
                  {mode === "demo"
                    ? "در حال مشاهده فضای کاری آزمایشی هستید. با امکانات آن آشنا شوید."
                    : "اتصال به سرویس TDMSMANAGMENT برقرار است. آماده شروع هستید."}
                </span>
                <button onClick={() => setHelp("guide")}>
                  آشنایی با محیط <ArrowUpRight size={12} />
                </button>
              </div>
            </section>
          )}

          {view === "companies" && <CompaniesPanel mode={mode} />}
          {view === "subcompanies" && <SubCompaniesPanel mode={mode} />}
          {view === "products" && (
            <section className="workspace-page">
              <div className="page-heading">
                <div>
                  <span className="section-eyebrow">فضای کاری شما</span>
                  <h1>محصولات</h1>
                  <p>نظمی تازه برای محصولات شما.</p>
                </div>
                <Button onClick={() => openEditor()}>
                  <Plus /> افزودن محصول
                </Button>
              </div>
              <div className="stats-grid">
                <Stat
                  label="تعداد محصولات"
                  value={loading ? "—" : number(products.length)}
                  icon={<Package />}
                  note="در فهرست محصولات شما"
                />
                <Stat
                  label="تعداد موجودی"
                  value={loading ? "—" : number(units)}
                  icon={<Layers3 />}
                  note="آماده برای قدم بعدی"
                />
                <Stat
                  label="ارزش موجودی"
                  value={loading ? "—" : money(value)}
                  icon={<BarChart3 />}
                  note="بر اساس قیمت فعلی محصولات"
                />
                <Stat
                  label="نیازمند بررسی"
                  value={loading ? "—" : number(low + out)}
                  icon={<Bell />}
                  note={`${low} محصول با موجودی کم · ${out} محصول ناموجود`}
                  warning={low + out > 0}
                />
              </div>
              <div className="catalog-panel">
                <div className="catalog-toolbar">
                  <div className="catalog-search">
                    <Search size={16} />
                    <Input
                      aria-label="جستجوی محصولات"
                      placeholder="جستجوی محصولات…"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="catalog-toolbar-right">
                    <FilterSelect
                      label="فیلتر موجودی"
                      value={stock}
                      onValueChange={(value) => {
                        setStock(value);
                        setPage(1);
                      }}
                      options={[
                        { value: "all", label: "همه وضعیت‌های موجودی" },
                        { value: "in", label: "موجود" },
                        { value: "low", label: "موجودی کم" },
                        { value: "out", label: "ناموجود" },
                      ]}
                    />
                    <Button
                      variant="outline"
                      aria-label="خروجی محصولات"
                      onClick={exportProducts}
                      disabled={loading || !!loadError}
                    >
                      <Download /> <span className="export-text">خروجی</span>
                    </Button>
                  </div>
                </div>
                {loadError ? (
                  <ErrorState message={loadError} retry={refresh} />
                ) : loading ? (
                  <LoadingState />
                ) : (
                  <>
                    <div className="table-scroll">
                      <Table hoverRow size="sm" className="product-table">
                        <thead>
                          <tr>
                            <th>
                              <button
                                onClick={() =>
                                  setSort({
                                    field: "name",
                                    ascending:
                                      sort.field === "name"
                                        ? !sort.ascending
                                        : true,
                                  })
                                }
                              >
                                محصول <ChevronsUpDown size={12} />
                              </button>
                            </th>
                            <th>وضعیت</th>
                            <th>
                              <button
                                onClick={() =>
                                  setSort({
                                    field: "price",
                                    ascending:
                                      sort.field === "price"
                                        ? !sort.ascending
                                        : true,
                                  })
                                }
                              >
                                قیمت <ChevronsUpDown size={12} />
                              </button>
                            </th>
                            <th>
                              <button
                                onClick={() =>
                                  setSort({
                                    field: "stockQuantity",
                                    ascending:
                                      sort.field === "stockQuantity"
                                        ? !sort.ascending
                                        : true,
                                  })
                                }
                              >
                                موجودی <ChevronsUpDown size={12} />
                              </button>
                            </th>
                            <th>تاریخ افزودن</th>
                            <th>
                              <span className="sr-only">عملیات</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paged.map((product) => (
                            <tr key={product.id}>
                              <td data-label="نام محصول">
                                <button
                                  className="product-name"
                                  onClick={() => setDetail(product)}
                                >
                                  <span className="product-thumb">
                                    <Package size={19} />
                                  </span>
                                  <span>
                                    <strong dir="auto">{product.name}</strong>
                                    <small>
                                      PRD-{String(product.id).padStart(4, "0")}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td data-label="وضعیت">
                                <StockBadge quantity={product.stockQuantity} />
                              </td>
                              <td className="tabular-nums" data-label="قیمت">
                                <bdi dir="ltr">{money(product.price)}</bdi>
                              </td>
                              <td className="tabular-nums" data-label="موجودی">
                                {number(product.stockQuantity)}{" "}
                                <span className="muted">واحد</span>
                              </td>
                              <td className="muted" data-label="تاریخ افزودن">
                                {new Date(
                                  product.createdAtUtc,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td data-label="عملیات">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`عملیات ${product.name}`}
                                    >
                                      <Ellipsis />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onSelect={() => setDetail(product)}
                                    >
                                      <Eye /> مشاهده جزئیات
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => openEditor(product)}
                                    >
                                      <Pencil /> ویرایش محصول
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:bg-red-50"
                                      onSelect={() => setDeleting(product)}
                                    >
                                      <Trash2 /> حذف محصول
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      {!paged.length && (
                        <div className="empty-state">
                          <Package size={30} />
                          <h3>
                            {products.length
                              ? "محصولی پیدا نشد"
                              : "شروعی تازه برای فهرست محصولات شما"}
                          </h3>
                          <p>
                            {products.length
                              ? "جستجو یا فیلتر موجودی را تغییر دهید."
                              : "اولین محصول را اضافه کنید و فضای کاری را بسازید."}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() =>
                              products.length
                                ? (setQuery(""), setStock("all"))
                                : openEditor()
                            }
                          >
                            {products.length
                              ? "پاک کردن فیلترها"
                              : "افزودن اولین محصول"}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="table-footer">
                      <span>
                        {filtered.length
                          ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)}`
                          : "0"}{" "}
                        از {filtered.length} محصول
                      </span>
                      <div>
                        <label>
                          تعداد ردیف در صفحه{" "}
                          <select
                            aria-label="تعداد ردیف در صفحه"
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setPage(1);
                            }}
                          >
                            <option>5</option>
                            <option>10</option>
                            <option>25</option>
                          </select>
                        </label>
                        <span>
                          {currentPage} / {pageCount}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="صفحه قبلی"
                          disabled={currentPage === 1}
                          onClick={() => setPage(currentPage - 1)}
                        >
                          <ChevronLeft />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="صفحه بعدی"
                          disabled={currentPage === pageCount}
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
                <Database size={12} />{" "}
                {mode === "demo"
                  ? "داده‌های آزمایشی · تغییرات روی این سرور ذخیره می‌شوند"
                  : "داده‌های زنده · متصل به سرویس دات‌نت ۱۰"}
              </p>
            </section>
          )}

          {view === "analytics" && (
            <section className="workspace-page">
              <div className="page-heading">
                <div>
                  <span className="section-eyebrow">نمای کلی</span>
                  <h1>تحلیل موجودی</h1>
                  <p>نگاهی روشن‌تر به محصولات شما.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={exportProducts}
                  disabled={loading || !!loadError}
                >
                  <Download /> خروجی محصولات
                </Button>
              </div>
              {loadError ? (
                <ErrorState message={loadError} retry={refresh} />
              ) : loading ? (
                <LoadingState />
              ) : (
                <>
                  <div className="stats-grid">
                    <Stat
                      label="تعداد محصولات"
                      value={number(products.length)}
                      icon={<Package />}
                      note="همه محصولات در یک جا"
                    />
                    <Stat
                      label="موجودی قابل استفاده"
                      value={number(units)}
                      icon={<Layers3 />}
                      note="تعداد کل واحدهای موجود"
                    />
                    <Stat
                      label="ارزش موجودی"
                      value={money(value)}
                      icon={<BarChart3 />}
                      note="قیمت × تعداد موجودی"
                    />
                    <Stat
                      label="درصد محصولات موجود"
                      value={`${products.length ? Math.round(((products.length - out) / products.length) * 100) : 0}%`}
                      icon={<Activity />}
                      note="محصولات دارای موجودی"
                    />
                  </div>
                  <div className="analytics-grid">
                    <div className="report-panel">
                      <div className="report-heading">
                        <div>
                          <h2>موجودی در یک نگاه</h2>
                          <p>ارزش محصولات، از بیشترین به کمترین.</p>
                        </div>
                        <span className="subtle-pill">دلار آمریکا</span>
                      </div>
                      {sortedValues.length ? (
                        <div className="bar-chart">
                          {sortedValues.map((p) => (
                            <div className="bar-row" key={p.id}>
                              <div>
                                <span>{p.name}</span>
                                <strong>
                                  {money(p.price * p.stockQuantity)}
                                </strong>
                              </div>
                              <div className="bar-track">
                                <span
                                  style={{
                                    width: `${p.price * p.stockQuantity > 0 ? Math.max(1, ((p.price * p.stockQuantity) / (sortedValues[0].price * sortedValues[0].stockQuantity || 1)) * 100) : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="report-empty">
                          برای مشاهده جزئیات موجودی، یک محصول اضافه کنید.
                        </p>
                      )}
                      <div className="report-foot">
                        <span className="status-dot" /> بر اساس فهرست فعلی
                        محصولات
                      </div>
                    </div>
                    <div className="report-panel">
                      <div className="report-heading">
                        <div>
                          <h2>توازن موجودی</h2>
                          <p>بخش‌های نیازمند بررسی را بشناسید.</p>
                        </div>
                        <ShieldCheck size={19} />
                      </div>
                      <div
                        className="stock-ring"
                        style={
                          {
                            "--stock-angle": `${products.length ? ((products.length - low - out) / products.length) * 360 : 0}deg`,
                          } as React.CSSProperties
                        }
                      >
                        <div>
                          <strong>{number(products.length)}</strong>
                          <span>محصول</span>
                        </div>
                      </div>
                      <div className="stock-legend">
                        <Link href="/dashboard/products?stock=in">
                          <span className="legend-dot healthy" /> موجود
                          <strong>{products.length - low - out}</strong>
                          <ChevronRight size={13} />
                        </Link>
                        <Link href="/dashboard/products?stock=low">
                          <span className="legend-dot low" /> موجودی کم
                          <strong>{low}</strong>
                          <ChevronRight size={13} />
                        </Link>
                        <Link href="/dashboard/products?stock=out">
                          <span className="legend-dot out" /> ناموجود
                          <strong>{out}</strong>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="insight-callout">
                    <span className="insight-icon">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <h3>
                        {low + out
                          ? "کمی توجه، تأثیری بزرگ دارد."
                          : "همه چیز مرتب است. ادامه دهید."}
                      </h3>
                      <p>
                        {low + out
                          ? `${low + out} محصول نیازمند بررسی موجودی است. فهرست محصولات را باز کنید و موجودی را به‌روز کنید.`
                          : "موجودی شما آماده است. هر زمان خواستید محصول بعدی را اضافه کنید."}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/products")}
                    >
                      باز کردن فهرست محصولات <ArrowRight />
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

          {view === "settings" && (
            <section className="workspace-page settings-page">
              <div className="page-heading">
                <div>
                  <span className="section-eyebrow">فضای کاری خودتان</span>
                  <h1>تنظیمات حساب کاربری</h1>
                  <p>فضای کاری و اطلاعات لازم برای مدیریت آن.</p>
                </div>
              </div>
              <Tabs defaultValue="account">
                <TabsList>
                  <TabsTrigger value="account">حساب کاربری</TabsTrigger>
                  <TabsTrigger value="security">امنیت و اتصال</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                  <div className="settings-panel">
                    <div className="settings-panel-header">
                      <span className="settings-avatar">
                        <UserRound />
                      </span>
                      <div>
                        <h2>مدیر فضای کاری</h2>
                        <p>
                          <bdi dir="ltr">{email}</bdi>
                        </p>
                      </div>
                      <span className="subtle-pill">مدیر</span>
                    </div>
                    <dl className="settings-details">
                      <div>
                        <dt>نام فضای کاری</dt>
                        <dd>فضای کاری TDMS</dd>
                      </div>
                      <div>
                        <dt>برنامه</dt>
                        <dd>TDMSMANAGMENT</dd>
                      </div>
                      <div>
                        <dt>ایمیل حساب کاربری</dt>
                        <dd>
                          <bdi dir="ltr">{email}</bdi>
                        </dd>
                      </div>
                      <div>
                        <dt>حالت فضای کاری</dt>
                        <dd>
                          <span className="status-dot" />
                          {mode === "demo"
                            ? "فضای کاری آزمایشی محلی"
                            : "فضای کاری متصل به سرویس"}
                        </dd>
                      </div>
                    </dl>
                    <div className="settings-panel-footer">
                      <p>اطلاعات ورود توسط مدیر سرور مدیریت می‌شود.</p>
                      <Button
                        variant="outline"
                        onClick={() => setHelp("support")}
                      >
                        دریافت راهنما <ArrowUpRight />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="security">
                  <div className="settings-panel">
                    <div className="settings-panel-header">
                      <span className="settings-avatar">
                        <ShieldCheck />
                      </span>
                      <div>
                        <h2>دسترسی و اتصال</h2>
                        <p>اطلاعات ضروری در یک جا.</p>
                      </div>
                    </div>
                    <dl className="settings-details">
                      <div>
                        <dt>نشست کاربری</dt>
                        <dd>
                          <span className="status-dot" /> وارد شده · اعتبار
                          نشست: ۸ ساعت
                        </dd>
                      </div>
                      <div>
                        <dt>امنیت نشست</dt>
                        <dd>کوکی نشست امضاشده با دسترسی محدود به سرور</dd>
                      </div>
                      <div>
                        <dt>منبع داده</dt>
                        <dd>
                          {mode === "demo"
                            ? "ذخیره‌سازی محلی داده‌های آزمایشی"
                            : "سرویس دات‌نت"}
                        </dd>
                      </div>
                      <div>
                        <dt>دسترسی به سرویس</dt>
                        <dd>
                          اتصال از طریق سرور · بدون نگهداری اطلاعات دسترسی در
                          مرورگر
                        </dd>
                      </div>
                      <div>
                        <dt>تنظیم اتصال</dt>
                        <dd>
                          <code>TDMS_DATA_SOURCE / TDMS_API_BASE_URL</code>
                        </dd>
                      </div>
                    </dl>
                    <div className="settings-panel-footer">
                      <p>
                        تنظیمات سرور در فایل محیطی رابط کاربری مشخص می‌شوند.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setHelp("guide")}
                      >
                        راهنمای اتصال <ArrowUpRight />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="signout-panel">
                <div>
                  <h3>فعلاً کارتان تمام شده؟</h3>
                  <p>برای پایان دادن به نشست در این دستگاه، خارج شوید.</p>
                </div>
                <Button variant="outline" onClick={() => void logout()}>
                  <LogOut /> خروج از حساب
                </Button>
              </div>
            </section>
          )}
        </main>
        <footer className="app-footer">
          <div>
            <button onClick={() => setHelp("support")}>پشتیبانی</button>
            <span />
            <button onClick={() => setHelp("status")}>وضعیت سامانه</button>
            <span />
            <button onClick={() => setHelp("guide")}>مستندات</button>
            <span />
            <button onClick={() => setHelp("privacy")}>حریم خصوصی</button>
          </div>
          <p>© {new Date().getFullYear()} TDMSMANAGMENT</p>
        </footer>
      </div>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="command-dialog">
          <DialogHeader className="sr-only">
            <DialogTitle>جستجو در فضای کاری</DialogTitle>
            <DialogDescription>
              صفحه یا محصول موردنظر را پیدا کنید. برای انتخاب از کلیدهای Tab و
              Enter استفاده کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="command-search">
            <Search size={18} />
            <Input
              autoFocus
              aria-label="جستجوی فضای کاری"
              placeholder="کدام بخش را جستجو می‌کنید؟"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
            />
          </div>
          <div className="command-results">
            {searchViews.length > 0 && (
              <>
                <span className="command-section">فضای کاری</span>
                {searchViews.map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      router.push(route(key));
                      setCommandOpen(false);
                    }}
                  >
                    <span className="command-result-icon">
                      {key === "home" ? (
                        <Home size={16} />
                      ) : key === "products" ? (
                        <Package size={16} />
                      ) : key === "companies" || key === "subcompanies" ? (
                        <Building2 size={16} />
                      ) : key === "analytics" ? (
                        <BarChart3 size={16} />
                      ) : (
                        <Settings2 size={16} />
                      )}
                    </span>
                    {titleFor[key]}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </>
            )}
            {searchProducts.length > 0 && (
              <>
                <span className="command-section">محصولات</span>
                {searchProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCommandOpen(false);
                      setDetail(p);
                    }}
                  >
                    <span className="command-result-icon">
                      <Package size={16} />
                    </span>
                    {p.name}
                    <small>
                      <bdi dir="ltr">{money(p.price)}</bdi>
                    </small>
                  </button>
                ))}
              </>
            )}
            {!searchViews.length && !searchProducts.length && (
              <p className="command-empty">
                نتیجه‌ای پیدا نشد. نام محصول یا «تحلیل» را جستجو کنید.
              </p>
            )}
          </div>
          <div className="command-footer">
            <span>
              <kbd>Tab</kbd> برای جابه‌جایی
            </span>
            <span>
              <kbd>↵</kbd> برای باز کردن
            </span>
            <span>
              <kbd>esc</kbd> برای بستن
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!saving && !open) setEditor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <span className="dialog-icon">
              <Package size={20} />
            </span>
            <DialogTitle>
              {editor?.product ? "ویرایش محصول" : "افزودن محصول تازه"}
            </DialogTitle>
            <DialogDescription>
              {editor?.product
                ? "اطلاعات زیر را به‌روزرسانی کنید."
                : "اطلاعات اصلی را وارد کنید. بعداً می‌توانید آن‌ها را تغییر دهید."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProduct} className="product-form">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                نام محصول <span className="required-mark">*</span>
              </Label>
              <Input
                id="product-name"
                dir="auto"
                autoFocus
                value={fields.name}
                onChange={(e) => setFields({ ...fields, name: e.target.value })}
                required
                maxLength={200}
                placeholder="مثلاً صفحه‌کلید بی‌سیم"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">
                توضیحات <span className="optional-label">(اختیاری)</span>
              </Label>
              <textarea
                id="product-description"
                dir="auto"
                value={fields.description}
                onChange={(e) =>
                  setFields({ ...fields, description: e.target.value })
                }
                maxLength={2000}
                rows={3}
                placeholder="چند توضیح درباره این محصول…"
              />
            </div>
            <div className="form-two-columns">
              <div className="space-y-2">
                <Label htmlFor="product-price">
                  قیمت (دلار آمریکا) <span className="required-mark">*</span>
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  max="999999999.99"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={fields.price}
                  onChange={(e) =>
                    setFields({ ...fields, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">
                  تعداد موجودی <span className="required-mark">*</span>
                </Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  required
                  placeholder="0"
                  value={fields.stockQuantity}
                  onChange={(e) =>
                    setFields({ ...fields, stockQuantity: e.target.value })
                  }
                />
              </div>
            </div>
            {formError && <FormAlert>{formError}</FormAlert>}
            <div className="dialog-form-footer">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditor(null)}
                disabled={saving}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
                {editor?.product ? "ذخیره تغییرات" : "ایجاد محصول"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!saving && !open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <span className="dialog-icon destructive-icon">
              <Trash2 size={20} />
            </span>
            <DialogTitle>این محصول حذف شود؟</DialogTitle>
            <DialogDescription>
              “{deleting?.name}» از فهرست محصولات حذف خواهد شد. این کار قابل
              بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-footer">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={saving}
            >
              نگهداری محصول
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteProduct()}
              disabled={saving}
            >
              {saving && <LoaderCircle className="animate-spin" />}حذف محصول
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <span className="dialog-icon">
              <Package size={21} />
            </span>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>
              {detail?.description || "توضیحی ثبت نشده است."}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <dl className="product-detail">
                <div>
                  <dt>وضعیت</dt>
                  <dd>
                    <StockBadge quantity={detail.stockQuantity} />
                  </dd>
                </div>
                <div>
                  <dt>قیمت</dt>
                  <dd>
                    <bdi dir="ltr">{money(detail.price)}</bdi>
                  </dd>
                </div>
                <div>
                  <dt>تعداد موجودی</dt>
                  <dd>{number(detail.stockQuantity)}</dd>
                </div>
                <div>
                  <dt>شناسه محصول</dt>
                  <dd>PRD-{String(detail.id).padStart(4, "0")}</dd>
                </div>
                <div>
                  <dt>زمان افزودن به فضای کاری</dt>
                  <dd>
                    {new Date(detail.createdAtUtc).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
              <Button onClick={() => openEditor(detail)}>
                <Pencil /> ویرایش محصول
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!help}
        onOpenChange={(open) => {
          if (!open) setHelp(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <span className="dialog-icon">
              {help === "status" ? (
                <Activity size={20} />
              ) : help === "privacy" ? (
                <ShieldCheck size={20} />
              ) : (
                <BookOpen size={20} />
              )}
            </span>
            <DialogTitle>
              {help === "support"
                ? "راهنما در دسترس شماست."
                : help === "status"
                  ? "وضعیت فضای کاری"
                  : help === "privacy"
                    ? "فضای کاری شما، داده‌های شما."
                    : "به فضای کاری خود خوش آمدید."}
            </DialogTitle>
            <DialogDescription>
              {help === "support"
                ? "مدیر فضای کاری، حساب و اتصال سرور شما را مدیریت می‌کند. در صورت نیاز به کمک، اطلاعات زیر را با او در میان بگذارید."
                : help === "status"
                  ? "وضعیت فعلی اتصال فضای کاری."
                  : help === "privacy"
                    ? "اطلاعات ورود در مرورگر ذخیره نمی‌شود. نشست شما با یک کوکی امضاشده و محدود به سرور محافظت می‌شود."
                    : "اطلاعات لازم برای شروع کار با TDMSMANAGMENT."}
            </DialogDescription>
          </DialogHeader>
          {help === "guide" ? (
            <div className="guide-list">
              <div>
                <span>01</span>
                <div>
                  <h3>فهرست محصولات را بسازید</h3>
                  <p>
                    محصول را اضافه کنید و قیمت و موجودی آن را وارد کنید. همه
                    اطلاعات در بخش محصولات در دسترس است.
                  </p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <h3>همیشه دید روشنی داشته باشید</h3>
                  <p>
                    تحلیل موجودی، خلاصه‌ای از تعداد و ارزش محصولات شما ارائه
                    می‌کند.
                  </p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <h3>اتصال به سرویس دات‌نت</h3>
                  <p>
                    تنظیم کنید <code>TDMS_DATA_SOURCE=api</code> و{" "}
                    <code>TDMS_API_BASE_URL</code> در <code>.env.local</code>،
                    سپس رابط کاربری را دوباره اجرا کنید. راهنمای اجرا در فایل
                    README رابط کاربری آمده است.
                  </p>
                </div>
              </div>
            </div>
          ) : help === "privacy" ? (
            <div className="help-body">
              <p>
                {mode === "demo"
                  ? "محصولات آزمایشی در پوشه داده‌های محلی این سرور ذخیره می‌شوند."
                  : "محصولات از سرویس دات‌نت خوانده و در همان سرویس ذخیره می‌شوند."}{" "}
                از ردیاب‌های تحلیلی یا سرویس‌های حساب کاربری شخص ثالث استفاده
                نمی‌شود.
              </p>
              <p>
                خروج از حساب، کوکی نشست را پاک می‌کند. برای حذف محصولات آزمایشی
                محلی، برنامه را متوقف و پوشه داده‌های محلی رابط کاربری را حذف
                کنید.
              </p>
            </div>
          ) : (
            <dl className="product-detail">
              <div>
                <dt>برنامه</dt>
                <dd>TDMSMANAGMENT v1.0</dd>
              </div>
              <div>
                <dt>حساب کاربری</dt>
                <dd>
                  <bdi dir="ltr">{email}</bdi>
                </dd>
              </div>
              <div>
                <dt>منبع داده</dt>
                <dd>{mode === "demo" ? "نسخه آزمایشی محلی" : ".NET API"}</dd>
              </div>
              <div>
                <dt>اتصال فهرست محصولات</dt>
                <dd>
                  <span
                    className={cn("status-dot", loadError && "error-dot")}
                  />
                  {loading
                    ? "در حال بررسی…"
                    : loadError
                      ? "اتصال نیازمند بررسی است"
                      : "در دسترس"}
                </dd>
              </div>
            </dl>
          )}
          <Button variant="outline" onClick={() => setHelp(null)}>
            متوجه شدم <Check />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  return (
    <Chip
      color={quantity === 0 ? "danger" : quantity < 10 ? "warning" : "success"}
      size="sm"
      variant="soft"
    >
      {quantity === 0 ? "ناموجود" : quantity < 10 ? "موجودی کم" : "موجود"}
    </Chip>
  );
}
function Stat({
  label,
  value,
  icon,
  note,
  warning,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  note: string;
  warning?: boolean;
}) {
  return (
    <div className="stat-card">
      <div>
        <span>{label}</span>
        <span className={cn("stat-icon", warning && "warning")}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>
        {warning && <span className="orange-dot" />}
        {note}
      </p>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <OrbitRing className="size-6 text-primary" />
      <span>در حال آماده‌سازی فضای کاری…</span>
    </div>
  );
}
function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => Promise<void>;
}) {
  return (
    <div className="empty-state error-state" role="alert">
      <Database size={28} />
      <h3>اتصال را دوباره برقرار کنید.</h3>
      <p>{message}</p>
      <Button variant="outline" onClick={() => void retry()}>
        تلاش دوباره
      </Button>
    </div>
  );
}

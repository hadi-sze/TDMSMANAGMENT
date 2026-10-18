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
import { Brand } from "@/components/brand";
import { CompaniesPanel } from "@/components/companies-panel";
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

type View = "home" | "products" | "companies" | "analytics" | "settings";
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
  home: "Account home",
  products: "Products",
  companies: "Companies",
  analytics: "Inventory analytics",
  settings: "Account settings",
};

async function errorMessage(response: Response) {
  try {
    const body = await response.json();
    return (
      body.error ||
      (body.errors && (Object.values(body.errors).flat()[0] as string)) ||
      body.detail ||
      body.title ||
      "Something went wrong. Please try again."
    );
  } catch {
    return "Something went wrong. Please try again.";
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
  const [recents, setRecents] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(view === "companies");
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
    if (view === "companies") setCompaniesOpen(true);
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
        editor.product ? "Product updated" : "Product added to your workspace",
      );
      setEditor(null);
      await refresh();
    } catch {
      setFormError(
        "The product could not be saved. Check your connection and try again.",
      );
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
      toast.success("Product deleted");
      setDeleting(null);
      await refresh();
    } catch {
      toast.error("The product could not be deleted. Please try again.");
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
      toast.error("Unable to sign out. Please try again.");
    }
  }
  function exportProducts() {
    const escape = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      ["ID", "Name", "Description", "Price", "Stock", "Created UTC"],
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
    toast.success("Product export downloaded");
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
        <Link href="/dashboard" aria-label="TDMSMANAGMENT home">
          <Brand compact />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="workspace-switch">
              <span>
                <strong>TDMS workspace</strong>
                <small>TDMSMANAGMENT</small>
              </span>
              <ChevronsUpDown size={13} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Your workspace</DropdownMenuLabel>
            <DropdownMenuLabel>{email}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
              <Check /> TDMS workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard/settings")}
            >
              <Settings2 /> Workspace settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="sidebar-body">
        <button className="quick-search" onClick={() => setCommandOpen(true)}>
          <Search size={14} />
          <span>Quick search...</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav aria-label="Main navigation">
          <Link
            href="/dashboard"
            className={cn("nav-item", view === "home" && "active")}
          >
            <Home />
            <span>Account home</span>
          </Link>
          <button
            className="nav-item"
            onClick={() => setRecents(!recents)}
            aria-expanded={recents}
          >
            <Clock3 />
            <span>Recents</span>
            <ChevronDown
              className={cn("nav-chevron", !recents && "-rotate-90")}
            />
          </button>
          {recents && (
            <div className="recent-list">
              <Link href="/dashboard/products">
                Products<small>Your catalog</small>
              </Link>
              <Link href="/dashboard/analytics">
                Inventory overview<small>Analytics</small>
              </Link>
              <Link href="/dashboard/settings">
                Workspace settings<small>Manage account</small>
              </Link>
            </div>
          )}
          <Link
            href="/dashboard/products"
            className={cn("nav-item", view === "products" && "active")}
          >
            <Package />
            <span>Products</span>
            <span className="nav-count">{loading ? "–" : products.length}</span>
          </Link>
          <button
            className={cn("nav-item", view === "companies" && "active")}
            aria-label="Companies menu"
            aria-expanded={companiesOpen}
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setCompaniesOpen(true);
              } else setCompaniesOpen(!companiesOpen);
            }}
          >
            <Building2 />
            <span>Companies</span>
            <ChevronRight
              className={cn("nav-chevron", companiesOpen && "rotate-90")}
            />
          </button>
          {companiesOpen && (
            <ul
              className="recent-list company-navigation"
              aria-label="Company navigation"
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
                  All companies
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/companies?new=1"
                  onClick={() => setMobile(false)}
                >
                  <Plus size={12} />
                  Add company
                </Link>
              </li>
            </ul>
          )}
          <Link
            href="/dashboard/analytics"
            className={cn("nav-item", view === "analytics" && "active")}
          >
            <Activity />
            <span>Overview & insights</span>
            <span className="new-tag">New</span>
            <ChevronRight className="nav-chevron" />
          </Link>
          <div className="nav-label">Build</div>
          <button className="nav-item" onClick={() => openEditor()}>
            <Box />
            <span>Create product</span>
            <Plus className="nav-chevron" />
          </button>
          <button
            className="nav-item"
            aria-expanded={inventoryOpen}
            onClick={() => setInventoryOpen(!inventoryOpen)}
          >
            <Layers3 />
            <span>Inventory</span>
            <ChevronRight
              className={cn("nav-chevron", inventoryOpen && "rotate-90")}
            />
          </button>
          {inventoryOpen && (
            <div className="recent-list inventory-subnav">
              <Link href="/dashboard/products">All products</Link>
              <Link href="/dashboard/products?stock=low">Low stock</Link>
              <Link href="/dashboard/products?stock=out">Out of stock</Link>
            </div>
          )}
          <Link href="/dashboard/analytics" className="nav-item">
            <BarChart3 />
            <span>Reports & analytics</span>
            <ChevronRight className="nav-chevron" />
          </Link>
          <button
            className="nav-item"
            onClick={exportProducts}
            disabled={loading || !!loadError}
          >
            <Database />
            <span>Data & exports</span>
            <Download className="nav-chevron" />
          </button>
          <div className="nav-label">Protect & connect</div>
          <Link href="/dashboard/settings" className="nav-item">
            <ShieldCheck />
            <span>Access & security</span>
            <ChevronRight className="nav-chevron" />
          </Link>
          <button className="nav-item" onClick={() => setHelp("guide")}>
            <BookOpen />
            <span>Getting started</span>
            <ArrowUpRight className="nav-chevron" />
          </button>
          <div className="sidebar-account">
            <Link
              href="/dashboard/settings"
              className={cn("nav-item", view === "settings" && "active")}
            >
              <Settings2 />
              <span>Manage account</span>
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
        <span>
          <span className="status-dot" />{" "}
          {mode === "demo" ? "Demo workspace" : "Connected to .NET"}
        </span>
      </div>
    </>
  );

  return (
    <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar desktop-sidebar">{sidebarContents}</aside>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="mobile-nav-dialog">
          <DialogHeader className="sr-only">
            <DialogTitle>Workspace navigation</DialogTitle>
            <DialogDescription>
              Navigate your TDMSMANAGMENT workspace.
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
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </Button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={12} />
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
              <span>Quick guide</span>
            </button>
            <button onClick={() => setHelp("support")}>
              <CircleHelp size={14} />
              <span>Support</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="user-menu" aria-label="Open user menu">
                  <UserRound size={17} />
                  <span className="user-status" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
                <DropdownMenuLabel className="text-foreground">
                  {email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => router.push("/dashboard/settings")}
                >
                  <Settings2 /> Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void logout()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main
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
                A clearer view of your workspace
                <ArrowUpRight size={13} />
              </button>
              <h1>Pick up where you left off.</h1>
              <p className="home-subtitle">
                A place for everything. More room for what’s next.
              </p>
              <button
                className="hero-search"
                onClick={() => {
                  setCommandQuery("");
                  setCommandOpen(true);
                }}
              >
                <Search size={19} />
                <span>Search your workspace...</span>
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
                      A small step. A new possibility.
                    </span>
                    <div className="art-plus art-plus-one">+</div>
                    <div className="art-plus art-plus-two">+</div>
                  </div>
                  <div className="launch-card-body">
                    <span className="card-kicker">START SOMETHING</span>
                    <h2>Create something new</h2>
                    <p>
                      Bring a new product into your workspace. Add the details
                      and let the good work begin.
                    </p>
                    <Button variant="outline" onClick={() => openEditor()}>
                      <Plus /> Add a product
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
                    <span className="card-kicker">KEEP IT ORGANIZED</span>
                    <h2>Everything, in one place</h2>
                    <p>
                      Find your products, keep an eye on stock, and turn a busy
                      catalog into a clear picture.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/products")}
                    >
                      View products <ArrowRight />
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
                    <span className="card-kicker">MAKE IT YOURS</span>
                    <h2>Your workspace, protected</h2>
                    <p>
                      Your account and connection details, together. A little
                      peace of mind for your everyday work.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/settings")}
                    >
                      Account settings <ArrowRight />
                    </Button>
                  </div>
                </article>
              </div>
              <div className="home-note">
                <span className="status-dot" />
                <span>
                  {mode === "demo"
                    ? "You’re exploring a demo workspace. Make yourself at home."
                    : "Connected to your TDMSMANAGMENT API. You’re ready to go."}
                </span>
                <button onClick={() => setHelp("guide")}>
                  Get oriented <ArrowUpRight size={12} />
                </button>
              </div>
            </section>
          )}

          {view === "companies" && <CompaniesPanel mode={mode} />}
          {view === "products" && (
            <section className="workspace-page">
              <div className="page-heading">
                <div>
                  <span className="section-eyebrow">YOUR WORKSPACE</span>
                  <h1>Products</h1>
                  <p>A little order for everything you offer.</p>
                </div>
                <Button onClick={() => openEditor()}>
                  <Plus /> Add product
                </Button>
              </div>
              <div className="stats-grid">
                <Stat
                  label="Total products"
                  value={loading ? "—" : number(products.length)}
                  icon={<Package />}
                  note="In your catalog"
                />
                <Stat
                  label="Units in stock"
                  value={loading ? "—" : number(units)}
                  icon={<Layers3 />}
                  note="Ready for what’s next"
                />
                <Stat
                  label="Inventory value"
                  value={loading ? "—" : money(value)}
                  icon={<BarChart3 />}
                  note="At current product prices"
                />
                <Stat
                  label="Needs attention"
                  value={loading ? "—" : number(low + out)}
                  icon={<Bell />}
                  note={`${low} low stock · ${out} out of stock`}
                  warning={low + out > 0}
                />
              </div>
              <div className="catalog-panel">
                <div className="catalog-toolbar">
                  <div className="catalog-search">
                    <Search size={16} />
                    <Input
                      aria-label="Search products"
                      placeholder="Search products..."
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="catalog-toolbar-right">
                    <select
                      aria-label="Filter by stock"
                      value={stock}
                      onChange={(e) => {
                        setStock(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">All stock levels</option>
                      <option value="in">In stock</option>
                      <option value="low">Low stock</option>
                      <option value="out">Out of stock</option>
                    </select>
                    <Button
                      variant="outline"
                      aria-label="Export products"
                      onClick={exportProducts}
                      disabled={loading || !!loadError}
                    >
                      <Download /> <span className="export-text">Export</span>
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
                      <table className="product-table">
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
                                Product <ChevronsUpDown size={12} />
                              </button>
                            </th>
                            <th>Status</th>
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
                                Price <ChevronsUpDown size={12} />
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
                                Stock <ChevronsUpDown size={12} />
                              </button>
                            </th>
                            <th>Added</th>
                            <th>
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paged.map((product) => (
                            <tr key={product.id}>
                              <td>
                                <button
                                  className="product-name"
                                  onClick={() => setDetail(product)}
                                >
                                  <span className="product-thumb">
                                    <Package size={19} />
                                  </span>
                                  <span>
                                    <strong>{product.name}</strong>
                                    <small>
                                      PRD-{String(product.id).padStart(4, "0")}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <StockBadge quantity={product.stockQuantity} />
                              </td>
                              <td className="tabular-nums">
                                {money(product.price)}
                              </td>
                              <td className="tabular-nums">
                                {number(product.stockQuantity)}{" "}
                                <span className="muted">units</span>
                              </td>
                              <td className="muted">
                                {new Date(
                                  product.createdAtUtc,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Actions for ${product.name}`}
                                    >
                                      <Ellipsis />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onSelect={() => setDetail(product)}
                                    >
                                      <Eye /> View details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => openEditor(product)}
                                    >
                                      <Pencil /> Edit product
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:bg-red-50"
                                      onSelect={() => setDeleting(product)}
                                    >
                                      <Trash2 /> Delete product
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!paged.length && (
                        <div className="empty-state">
                          <Package size={30} />
                          <h3>
                            {products.length
                              ? "No products found"
                              : "A fresh start for your catalog"}
                          </h3>
                          <p>
                            {products.length
                              ? "Try another search or stock filter."
                              : "Add your first product and make this space yours."}
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
                              ? "Clear filters"
                              : "Add your first product"}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="table-footer">
                      <span>
                        {filtered.length
                          ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)}`
                          : "0"}{" "}
                        of {filtered.length} products
                      </span>
                      <div>
                        <label>
                          Rows per page{" "}
                          <select
                            aria-label="Rows per page"
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
                          aria-label="Previous page"
                          disabled={currentPage === 1}
                          onClick={() => setPage(currentPage - 1)}
                        >
                          <ChevronLeft />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Next page"
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
                  ? "Demo data · Changes are saved locally on this server"
                  : "Live data · Connected to your .NET 10 API"}
              </p>
            </section>
          )}

          {view === "analytics" && (
            <section className="workspace-page">
              <div className="page-heading">
                <div>
                  <span className="section-eyebrow">THE BIG PICTURE</span>
                  <h1>Inventory analytics</h1>
                  <p>A clearer perspective on your products.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={exportProducts}
                  disabled={loading || !!loadError}
                >
                  <Download /> Export products
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
                      label="Catalog size"
                      value={number(products.length)}
                      icon={<Package />}
                      note="Products, all together"
                    />
                    <Stat
                      label="Available inventory"
                      value={number(units)}
                      icon={<Layers3 />}
                      note="Total units on hand"
                    />
                    <Stat
                      label="Inventory value"
                      value={money(value)}
                      icon={<BarChart3 />}
                      note="Price × quantity on hand"
                    />
                    <Stat
                      label="Stock availability"
                      value={`${products.length ? Math.round(((products.length - out) / products.length) * 100) : 0}%`}
                      icon={<Activity />}
                      note="Products with available stock"
                    />
                  </div>
                  <div className="analytics-grid">
                    <div className="report-panel">
                      <div className="report-heading">
                        <div>
                          <h2>Inventory at a glance</h2>
                          <p>Value by product, highest first.</p>
                        </div>
                        <span className="subtle-pill">USD</span>
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
                          Add a product to see your inventory breakdown.
                        </p>
                      )}
                      <div className="report-foot">
                        <span className="status-dot" /> Based on your current
                        catalog
                      </div>
                    </div>
                    <div className="report-panel">
                      <div className="report-heading">
                        <div>
                          <h2>A healthy balance</h2>
                          <p>Know where a little attention helps.</p>
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
                          <span>products</span>
                        </div>
                      </div>
                      <div className="stock-legend">
                        <Link href="/dashboard/products?stock=in">
                          <span className="legend-dot healthy" /> In stock
                          <strong>{products.length - low - out}</strong>
                          <ChevronRight size={13} />
                        </Link>
                        <Link href="/dashboard/products?stock=low">
                          <span className="legend-dot low" /> Low stock
                          <strong>{low}</strong>
                          <ChevronRight size={13} />
                        </Link>
                        <Link href="/dashboard/products?stock=out">
                          <span className="legend-dot out" /> Out of stock
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
                          ? "A little attention goes a long way."
                          : "Looking good. Keep it going."}
                      </h3>
                      <p>
                        {low + out
                          ? `${low + out} product${low + out === 1 ? " needs" : "s need"} a stock check. Open your catalog to bring everything up to date.`
                          : "Your inventory is ready. Add your next product whenever inspiration strikes."}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/products")}
                    >
                      Open catalog <ArrowRight />
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
                  <span className="section-eyebrow">MAKE YOURSELF AT HOME</span>
                  <h1>Account settings</h1>
                  <p>Your workspace, and the details that keep it running.</p>
                </div>
              </div>
              <Tabs defaultValue="account">
                <TabsList>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="security">
                    Security & connection
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                  <div className="settings-panel">
                    <div className="settings-panel-header">
                      <span className="settings-avatar">
                        <UserRound />
                      </span>
                      <div>
                        <h2>Workspace administrator</h2>
                        <p>{email}</p>
                      </div>
                      <span className="subtle-pill">Administrator</span>
                    </div>
                    <dl className="settings-details">
                      <div>
                        <dt>Workspace name</dt>
                        <dd>TDMS workspace</dd>
                      </div>
                      <div>
                        <dt>Application</dt>
                        <dd>TDMSMANAGMENT</dd>
                      </div>
                      <div>
                        <dt>Account email</dt>
                        <dd>{email}</dd>
                      </div>
                      <div>
                        <dt>Workspace mode</dt>
                        <dd>
                          <span className="status-dot" />
                          {mode === "demo"
                            ? "Local demo workspace"
                            : "Connected API workspace"}
                        </dd>
                      </div>
                    </dl>
                    <div className="settings-panel-footer">
                      <p>
                        Account credentials are managed by your server
                        administrator.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setHelp("support")}
                      >
                        Get help <ArrowUpRight />
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
                        <h2>Access & connection</h2>
                        <p>The essentials, in one place.</p>
                      </div>
                    </div>
                    <dl className="settings-details">
                      <div>
                        <dt>Session</dt>
                        <dd>
                          <span className="status-dot" /> Signed in · expires
                          after 8 hours
                        </dd>
                      </div>
                      <div>
                        <dt>Session protection</dt>
                        <dd>Signed, HTTP-only session cookie</dd>
                      </div>
                      <div>
                        <dt>Data source</dt>
                        <dd>
                          {mode === "demo"
                            ? "Local demo data store"
                            : "ASP.NET Core REST API"}
                        </dd>
                      </div>
                      <div>
                        <dt>API access</dt>
                        <dd>Server-side proxy · no browser API credentials</dd>
                      </div>
                      <div>
                        <dt>Configure connection</dt>
                        <dd>
                          <code>TDMS_DATA_SOURCE / TDMS_API_BASE_URL</code>
                        </dd>
                      </div>
                    </dl>
                    <div className="settings-panel-footer">
                      <p>
                        Server settings are configured in the frontend’s
                        environment file.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setHelp("guide")}
                      >
                        Connection guide <ArrowUpRight />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="signout-panel">
                <div>
                  <h3>All done for now?</h3>
                  <p>Sign out to end this session on your device.</p>
                </div>
                <Button variant="outline" onClick={() => void logout()}>
                  <LogOut /> Sign out
                </Button>
              </div>
            </section>
          )}
        </main>
        <footer className="app-footer">
          <div>
            <button onClick={() => setHelp("support")}>Support</button>
            <span />
            <button onClick={() => setHelp("status")}>System status</button>
            <span />
            <button onClick={() => setHelp("guide")}>Documentation</button>
            <span />
            <button onClick={() => setHelp("privacy")}>Privacy</button>
          </div>
          <p>© {new Date().getFullYear()} TDMSMANAGMENT</p>
        </footer>
      </div>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="command-dialog">
          <DialogHeader className="sr-only">
            <DialogTitle>Search your workspace</DialogTitle>
            <DialogDescription>
              Find a page or product. Use Tab and Enter to choose a result.
            </DialogDescription>
          </DialogHeader>
          <div className="command-search">
            <Search size={18} />
            <Input
              autoFocus
              aria-label="Search workspace"
              placeholder="Where would you like to go?"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
            />
          </div>
          <div className="command-results">
            {searchViews.length > 0 && (
              <>
                <span className="command-section">WORKSPACE</span>
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
                      ) : key === "companies" ? (
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
                <span className="command-section">PRODUCTS</span>
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
                    <small>{money(p.price)}</small>
                  </button>
                ))}
              </>
            )}
            {!searchViews.length && !searchProducts.length && (
              <p className="command-empty">
                No results. Try a product name or “analytics”.
              </p>
            )}
          </div>
          <div className="command-footer">
            <span>
              <kbd>Tab</kbd> to navigate
            </span>
            <span>
              <kbd>↵</kbd> to open
            </span>
            <span>
              <kbd>esc</kbd> to close
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
              {editor?.product
                ? "Edit product"
                : "A new addition to your workspace"}
            </DialogTitle>
            <DialogDescription>
              {editor?.product
                ? "Update the details below. A little upkeep goes a long way."
                : "Start with the essentials. You can always make changes later."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProduct} className="product-form">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Product name <span className="required-mark">*</span>
              </Label>
              <Input
                id="product-name"
                autoFocus
                value={fields.name}
                onChange={(e) => setFields({ ...fields, name: e.target.value })}
                required
                maxLength={200}
                placeholder="e.g. Wireless keyboard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">
                Description <span className="optional-label">(optional)</span>
              </Label>
              <textarea
                id="product-description"
                value={fields.description}
                onChange={(e) =>
                  setFields({ ...fields, description: e.target.value })
                }
                maxLength={2000}
                rows={3}
                placeholder="A few details about this product..."
              />
            </div>
            <div className="form-two-columns">
              <div className="space-y-2">
                <Label htmlFor="product-price">
                  Price (USD) <span className="required-mark">*</span>
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
                  Stock quantity <span className="required-mark">*</span>
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
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-form-footer">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditor(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
                {editor?.product ? "Save changes" : "Create product"}
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
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              “{deleting?.name}” will be removed from your catalog. This action
              can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-footer">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={saving}
            >
              Keep product
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteProduct()}
              disabled={saving}
            >
              {saving && <LoaderCircle className="animate-spin" />}Delete
              product
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
              {detail?.description || "No description added yet."}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <dl className="product-detail">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StockBadge quantity={detail.stockQuantity} />
                  </dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{money(detail.price)}</dd>
                </div>
                <div>
                  <dt>Units in stock</dt>
                  <dd>{number(detail.stockQuantity)}</dd>
                </div>
                <div>
                  <dt>Product ID</dt>
                  <dd>PRD-{String(detail.id).padStart(4, "0")}</dd>
                </div>
                <div>
                  <dt>Added to workspace</dt>
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
                <Pencil /> Edit product
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
                ? "A little help, right here."
                : help === "status"
                  ? "Workspace status"
                  : help === "privacy"
                    ? "Your workspace. Your data."
                    : "Make yourself at home."}
            </DialogTitle>
            <DialogDescription>
              {help === "support"
                ? "Your workspace administrator manages your account and server connection. Share the information below if you need help."
                : help === "status"
                  ? "The current connection state for this workspace."
                  : help === "privacy"
                    ? "This frontend stores no account credentials in your browser. Your session is protected with a signed, HTTP-only cookie."
                    : "Everything you need to get started with TDMSMANAGMENT."}
            </DialogDescription>
          </DialogHeader>
          {help === "guide" ? (
            <div className="guide-list">
              <div>
                <span>01</span>
                <div>
                  <h3>Build your catalog</h3>
                  <p>
                    Add a product, set its price, and enter available stock.
                    Find it all under Products.
                  </p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <h3>Keep a clear view</h3>
                  <p>
                    Inventory analytics turns your current catalog into stock
                    and value summaries.
                  </p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <h3>Connect your .NET API</h3>
                  <p>
                    Set <code>TDMS_DATA_SOURCE=api</code> and{" "}
                    <code>TDMS_API_BASE_URL</code> in <code>.env.local</code>,
                    then restart Next.js. See the included frontend README for
                    commands.
                  </p>
                </div>
              </div>
            </div>
          ) : help === "privacy" ? (
            <div className="help-body">
              <p>
                {mode === "demo"
                  ? "Demo products are saved in the .data folder on this local server."
                  : "Your products are read from and saved to your configured .NET API."}{" "}
                No analytics trackers or third-party account services are used.
              </p>
              <p>
                Signing out clears your session cookie. To remove local demo
                products, stop the app and remove the frontend’s .data
                directory.
              </p>
            </div>
          ) : (
            <dl className="product-detail">
              <div>
                <dt>Application</dt>
                <dd>TDMSMANAGMENT v1.0</dd>
              </div>
              <div>
                <dt>Account</dt>
                <dd>{email}</dd>
              </div>
              <div>
                <dt>Data source</dt>
                <dd>{mode === "demo" ? "Local demo" : ".NET API"}</dd>
              </div>
              <div>
                <dt>Catalog connection</dt>
                <dd>
                  <span
                    className={cn("status-dot", loadError && "error-dot")}
                  />
                  {loading
                    ? "Checking…"
                    : loadError
                      ? "Connection needs attention"
                      : "Available"}
                </dd>
              </div>
            </dl>
          )}
          <Button variant="outline" onClick={() => setHelp(null)}>
            Got it <Check />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  return (
    <span
      className={cn(
        "stock-badge",
        quantity === 0 ? "out" : quantity < 10 ? "low" : "healthy",
      )}
    >
      <span />
      {quantity === 0
        ? "Out of stock"
        : quantity < 10
          ? "Low stock"
          : "In stock"}
    </span>
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
      <LoaderCircle className="animate-spin" size={22} />
      <span>Getting your workspace ready...</span>
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
      <h3>Let’s reconnect.</h3>
      <p>{message}</p>
      <Button variant="outline" onClick={() => void retry()}>
        Try again
      </Button>
    </div>
  );
}

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
      "The company could not be saved."
    );
  } catch {
    return "The request could not be completed. Please try again.";
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
      toast.success(editor.company ? "Company updated" : "Company added");
      setEditor(null);
      await refresh();
    } catch {
      setFormError("Unable to save this company. Please try again.");
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
      toast.success("Company deleted");
      setDeleting(null);
      await refresh();
    } catch {
      toast.error("Unable to delete this company. Please try again.");
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
          <span className="section-eyebrow">YOUR ORGANIZATIONS</span>
          <h1>Companies</h1>
          <p>Company details, organized in one place.</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus /> Add company
        </Button>
      </div>
      <div className="stats-grid company-stats">
        <div className="stat-card">
          <div>
            <span>Total companies</span>
            <Building2 size={16} />
          </div>
          <strong>{loading ? "—" : companies.length}</strong>
          <p>In your workspace</p>
        </div>
        <div className="stat-card">
          <div>
            <span>Active companies</span>
            <Check size={16} />
          </div>
          <strong>{loading ? "—" : active}</strong>
          <p>Available for your operations</p>
        </div>
        <div className="stat-card">
          <div>
            <span>Inactive companies</span>
            <Building2 size={16} />
          </div>
          <strong>{loading ? "—" : companies.length - active}</strong>
          <p>Retained for your records</p>
        </div>
      </div>
      <div className="catalog-panel">
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <Search size={16} />
            <Input
              aria-label="Search companies"
              placeholder="Search companies..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="catalog-toolbar-right">
            <select
              aria-label="Filter company status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {error ? (
          <div className="empty-state" role="alert">
            <Building2 size={28} />
            <h3>Let’s reconnect.</h3>
            <p>{error}</p>
            <Button variant="outline" onClick={() => void refresh()}>
              Try again
            </Button>
          </div>
        ) : loading ? (
          <div className="loading-state" role="status">
            <LoaderCircle className="animate-spin" size={22} />
            Loading companies...
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="product-table company-table">
                <thead>
                  <tr>
                    <th>Company name / record ID</th>
                    <th>Company ID</th>
                    <th>Company code</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((company) => (
                    <tr key={company.id}>
                      <td>
                        <button
                          className="product-name"
                          onClick={() => openEditor(company)}
                        >
                          <span className="product-thumb">
                            <Building2 size={19} />
                          </span>
                          <span>
                            <strong>{company.name}</strong>
                            <small>ID: {company.id}</small>
                          </span>
                        </button>
                      </td>
                      <td>{company.companyID}</td>
                      <td>
                        <code>{company.companycode}</code>
                      </td>
                      <td className="company-address" title={company.address}>
                        <span>{company.address}</span>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${company.isActive ? "healthy" : "out"}`}
                        >
                          <span />
                          {company.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${company.name}`}
                            >
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => openEditor(company)}
                            >
                              <Pencil /> Edit company
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-red-50"
                              onSelect={() => setDeleting(company)}
                            >
                              <Trash2 /> Delete company
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && (
                <div className="empty-state">
                  <Building2 size={32} />
                  <h3>
                    {companies.length
                      ? "No matching companies"
                      : "Your company directory starts here"}
                  </h3>
                  <p>
                    {companies.length
                      ? "Try a different search or status filter."
                      : "Add a company with its address, identifiers, and active status."}
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
                      ? "Clear filters"
                      : "Add your first company"}
                  </Button>
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                {filtered.length
                  ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)}`
                  : "0"}{" "}
                of {filtered.length} companies
              </span>
              <div>
                <span>
                  {currentPage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous company page"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next company page"
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
          ? "Demo companies · Changes are saved locally on this server"
          : "Live companies · Connected to your .NET 10 API and SQL Server"}
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
              {editor?.company ? "Edit company" : "Add company"}
            </DialogTitle>
            <DialogDescription>
              Enter the company’s details. All text fields are required.
            </DialogDescription>
          </DialogHeader>
          <form className="product-form" onSubmit={save}>
            {editor?.company && (
              <div className="space-y-2">
                <Label htmlFor="company-record-id">Record ID</Label>
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
                Company name <span className="required-mark">*</span>
              </Label>
              <Input
                id="company-name"
                autoFocus
                required
                maxLength={200}
                placeholder="e.g. Acme Industries"
                value={fields.name}
                onChange={(event) =>
                  setFields({ ...fields, name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">
                Address <span className="required-mark">*</span>
              </Label>
              <textarea
                id="company-address"
                required
                maxLength={500}
                rows={3}
                placeholder="Street, city, region, postal code"
                value={fields.address}
                onChange={(event) =>
                  setFields({ ...fields, address: event.target.value })
                }
              />
            </div>
            <div className="form-two-columns">
              <div className="space-y-2">
                <Label htmlFor="company-identifier">
                  Company ID <span className="required-mark">*</span>
                </Label>
                <Input
                  id="company-identifier"
                  required
                  maxLength={100}
                  placeholder="e.g. CMP-001"
                  value={fields.companyID}
                  onChange={(event) =>
                    setFields({ ...fields, companyID: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-code">
                  Company code <span className="required-mark">*</span>
                </Label>
                <Input
                  id="company-code"
                  required
                  maxLength={50}
                  placeholder="e.g. ACME"
                  value={fields.companycode}
                  onChange={(event) =>
                    setFields({ ...fields, companycode: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="company-active-field">
              <div>
                <Label htmlFor="company-active">Active company</Label>
                <p>Inactive companies remain in your directory.</p>
              </div>
              <input
                id="company-active"
                type="checkbox"
                checked={fields.isActive}
                onChange={(event) =>
                  setFields({ ...fields, isActive: event.target.checked })
                }
              />
            </div>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-form-footer">
              <Button
                variant="outline"
                type="button"
                disabled={saving}
                onClick={() => setEditor(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
                {editor?.company ? "Save changes" : "Create company"}
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
            <DialogTitle>Delete this company?</DialogTitle>
            <DialogDescription>
              “{deleting?.name}” will be removed. This action can’t be undone.
              You can edit the company and mark it inactive to keep its record
              instead.
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-footer">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setDeleting(null)}
            >
              Keep company
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void remove()}
            >
              {saving && <LoaderCircle className="animate-spin" />}Delete
              company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

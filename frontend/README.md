# TDMSMANAGMENT frontend

Next.js App Router, React, TypeScript, Tailwind CSS, Radix UI, locally owned shadcn/ui components, and MUI Joy UI. The dashboard takes its layout from the supplied Cloudflare account-home reference and uses TDMSMANAGMENT branding. It does not communicate with your Cloudflare account.

## Start locally

Requires Node.js 20.9 or later (Node.js 24 is available on this machine).

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. You will be redirected to `/login`.

Choose **Fill demo credentials**, then **Sign in**, or enter:

```text
Email:    admin@tdms.local
Password: TdmsDemo!2026
```

The demo credentials are available only during development unless explicitly configured. Demo product changes are persisted to `frontend/.data/products.json`. This file is excluded from Git and the deliverable ZIP. This demo store is intended for a single local server process; use the .NET API for a deployed or multi-instance application.

## UI component libraries

Both libraries are used in the live pages:

| Library | Components and usage |
| --- | --- |
| shadcn/ui + Radix | Buttons, text inputs, labels, dialogs, dropdown action menus, and account tabs |
| MUI Joy UI | Company/product tables, status chips, stock/status filters, company active switch, form error alerts, and loading indicators |

`src/components/theme-registry.tsx` integrates Joy's `CssVarsProvider` with Emotion and Next.js server style insertion. The theme uses the existing orange palette and Yekan/Arial font stack. The Emotion RTL plugin mirrors Joy styles, while shadcn components use their existing logical CSS and Radix direction props. The global stylesheet remains responsible for the page reset so both libraries share the same base styles.

Joy UI is pinned to the published `5.0.0-beta.52` version, with compatible Emotion dependencies recorded in the lockfile. The shadcn component source remains owned by this project in `src/components/ui`, and `components.json` records RTL mode. Shared Joy filter/alert helpers are in `src/components/ui/joy-controls.tsx`.

`OrbitRing` from the `@loading-ui` shadcn registry is available in `src/components/orbit-ring.tsx`:

```tsx
import { OrbitRing } from "@/components/orbit-ring";

<OrbitRing className="size-6 text-primary" />
```

Its decorative ring stays centered in RTL, and it stops animating when reduced motion is enabled. The registry is recorded in `components.json` for future additions.

References: [Joy UI App Router integration](https://mui.com/joy-ui/integrations/next-js-app-router/), [Joy UI RTL setup](https://mui.com/joy-ui/customization/right-to-left/), [shadcn RTL](https://ui.shadcn.com/docs/rtl).

## Included pages and behavior

### Right-to-left layout

The website defaults to RTL through `dir="rtl"` on the document. The desktop sidebar and mobile drawer open on the right; navigation, tables, dialogs, and login layouts follow the same direction. Logical CSS spacing preserves responsive behavior, and Radix menus/tabs receive RTL direction for positioning and keyboard navigation. Email addresses, passwords, prices, and numeric inputs preserve LTR character order. Company/product names and descriptions support automatic text direction. Interface titles, navigation, labels, buttons, placeholders, and dialogs are in Persian. The document uses `lang="fa"`. Brand names, addresses, codes, route/API keys, and connection identifiers retain their original values.

### Uploaded brand logo

The shared `Brand` component uses the user-supplied NIOC image at `public/branding/nioc-logo.webp`. The original transparent WebP is copied without modification and displayed with `next/image` at a contained aspect ratio. It appears in the desktop/mobile sidebar, login page, and not-found page. The project name remains TDMSMANAGMENT.

### Persian font

The user-provided Yekan font is bundled in `public/fonts/yekan/` and registered in `src/app/globals.css` using WOFF with TTF/OTF/EOT fallbacks. Persian text and digits use Yekan throughout the interface, including inputs and company tables. The face uses Arabic/Persian Unicode ranges and `font-display: swap`; Latin text keeps Arial/Helvetica. The original B Yekan WOFF2 remains a fallback with its upstream license and attribution. The uploaded FontLab `.vfc` source is retained in `design/fonts/` outside the public web directory.

Persian labels and headings use the uploaded Yekan font with the existing RTL layout.

| Route | Purpose |
| --- | --- |
| `/login` | Sign-in form, field validation, show/hide password, demo shortcut |
| `/dashboard` | Cloudflare-inspired account-home layout and three illustrated launch cards |
| `/dashboard/products` | Product CRUD, details, search, sorting, stock filters, pagination, CSV export |
| `/dashboard/companies` | Company directory, search, status filter, add/edit/delete forms |
| `/dashboard/subcompanies` | Subcompany CRUD with parent-company selection, parent/status filters, and pagination |
| `/dashboard/analytics` | Actual stock and inventory-value summaries calculated from your products |
| `/dashboard/settings` | Account details, security/connection information, sign out |

The sidebar collapses on desktop and opens as a drawer on mobile. **Ctrl+K** / **Cmd+K** opens workspace search. Menus, dialogs, labels, and account tabs use Radix primitives through the shadcn/ui component files in `src/components/ui`. All illustrations are CSS/SVG; there are no remote images or font dependencies.

Navigation groups animate when expanded or collapsed. The desktop sidebar resizes smoothly, the mobile drawer slides in/out, menus and dialogs animate on opening and closing, and account tabs fade in when selected. Motion uses CSS transitions/keyframes and the existing Radix presence handling; no additional animation package is required. Closed navigation panels are inert, and the existing `prefers-reduced-motion` rule reduces all animations and transitions.

**Companies** expands to **All companies** and **Add company**. The company form includes name, address, companyID, companycode, and an active switch. The database-generated record ID appears when editing. The company table shows every field, with active/inactive filtering and ten rows per page. Company IDs are text identifiers; leading zeros are preserved. Demo mode saves companies to `.data/companies.json`; API mode uses the new .NET `/api/companies` controller.

The dev/build scripts use Next.js’s supported `--webpack` option because Turbopack’s CSS worker failed on this workstation.

### Subcompanies

The Companies tree and each company row menu link to the subcompany directory. Add/edit forms select an existing parent company by its numeric record ID. Fields are `id` (generated), `name`, `companyId`, and `isActive`. The parent company's text `companyID` remains a separate business identifier. The status chips use **فعال / غیرفعال**. The new page uses the previously added `OrbitRing` while loading.

`/api/subcompanies` and `/api/subcompanies/[id]` provide authenticated CRUD in both API and demo modes. The list supports an optional `companyId` query parameter. Parent deletion is blocked while children exist. Demo parent/child writes share one queue to prevent orphan records during concurrent requests.

Run the isolated demo relationship test with `npm run test:demo`. It uses a unique temporary directory and does not modify the application's data files. SQL integration tests in the solution cover database foreign keys and API behavior. The live frontend-to-API CRUD check also passed, and its temporary records were removed.

## Connect the .NET 10 API

1. From the solution root, apply database migrations using the main README.
2. Start the API for local HTTP development:

```powershell
dotnet run --project src/TDMSMANAGMENT.Api --no-launch-profile --urls http://localhost:5043
```

3. Copy `frontend/.env.example` to `frontend/.env.local` and set:

```dotenv
TDMS_DATA_SOURCE=api
TDMS_API_BASE_URL=http://localhost:5043
```

4. Restart Next.js. The sidebar/footer will identify the API connection. API failures appear with a retry action; they do not silently switch to demo data.

The Next.js server proxies product requests to the existing `/api/products` controllers. No CORS change is needed because the browser makes same-origin requests to Next.js. The API origin stays on the server. The inventory overview loads up to 10,000 products through the API’s existing pagination.

For HTTPS, use a trusted server certificate. Configure Node.js to trust your development CA when needed; do not disable TLS verification. The HTTP command above omits the launch profile so ASP.NET Core does not receive an HTTPS redirect port for this development-only endpoint.

## Authentication

The .NET sample has no identity endpoints, so this frontend supplies a configurable **single-administrator server account**. This is separate from the product API. Set the following in `.env.local` or your server’s secret store:

```dotenv
TDMS_LOGIN_EMAIL=you@company.com
TDMS_LOGIN_PASSWORD=your-unique-password
TDMS_SESSION_SECRET=at-least-32-random-characters
```

Generate a session secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The session uses an HMAC-signed, HTTP-only cookie, an eight-hour expiry, SameSite=Lax, and Secure cookies in production. Dashboard pages and every product proxy endpoint validate the session. Writes enforce same-origin requests. Passwords are compared using scrypt and constant-time comparison. Login attempts are limited per server process. Development uses a randomly generated process-local signing key; restarting the server signs out development sessions.

Production requires a unique login password and a session secret; the development defaults are rejected. Use HTTPS for deployment. Keep the .NET API private behind the frontend or add API-side authentication before exposing its endpoints: frontend login protects the Next.js routes, while the original .NET API remains independently unauthenticated. This starter does not add registration, password-reset email, or multi-user identity management.

## Build and run

```powershell
npm run typecheck
npm run build
npm start
```

Configure production credentials and the session secret before signing in to `npm start`. The build itself does not require secrets. In production, select `TDMS_DATA_SOURCE=api` for SQL Server persistence.

## Structure

```text
frontend/
  components.json                 shadcn/ui configuration
  src/app/
    login/page.tsx
    dashboard/layout.tsx          Session guard
    dashboard/[[...section]]/page.tsx
    api/auth/{login,logout}/route.ts
    api/products/route.ts         Authenticated .NET proxy / demo adapter
    api/products/[id]/route.ts
    globals.css
  src/components/
    dashboard.tsx
    login-form.tsx
    brand.tsx
    ui/                           shadcn/ui components built on Radix
  src/lib/
    auth.ts
    products.ts
    utils.ts
```

Reference: [Cloudflare account home](https://dash.cloudflare.com/6bdbf200cb2a91eb0762c3c0d0873cbb/home). Only the layout was referenced; private account information is not included in the source.

## Verification — October 19, 2026

- Production build and TypeScript checks passed using Next.js 16.4.2.
- Persian titles, navigation, table/form labels, metadata, and notification accessibility labels were verified. The uploaded NIOC logo appears in the shared brand component; the login page and logo asset return HTTP 200.
- Joy UI filters were checked on companies and products, and the active switch was toggled with both its control and shadcn label inside a dialog. Whitespace-only company input was rejected before persistence and displayed the Joy error alert.
- Browser logs showed no application hydration errors after the Joy theme registry was added. Dependency installation reported zero vulnerabilities.
- Browser verified the RTL desktop sidebar, mobile drawer at 390px, Persian company form, RTL dropdown direction, and ArrowLeft navigation between account tabs.
- Uploaded Yekan files return HTTP 200, the copied WOFF matches the original SHA-256, and Persian company names use the Yekan font stack.
- Browser verified sign-in, home-page actions, product creation/search/editing, command search, and navigation.
- Checked the dashboard at a 390px viewport and verified the mobile navigation drawer.
- HTTP checks passed authentication, same-origin protection, validation, complete demo CRUD, persistence, and logout.
- A production Next.js process successfully proxied CRUD through the existing ASP.NET Core API to SQL Server. The temporary verification record was removed.

`npm run format` formats the frontend source using Prettier.

## Import center (مرکز ورود)

Open `/dashboard/import-center` to import new companies or subcompanies. Supports Excel `.xlsx`, XML files, JSON APIs (GET), and XML/SOAP 1.1 services (GET/POST). Limits: 5 MB, 500 records per batch; Excel up to 100 columns. Excel formulas are rejected; convert them to values. Download a template from the page.

Map columns and review all validation errors before confirming. Subcompany `companyId` is the numeric parent record ID, not the business `companyID`. Existing company IDs/codes and subcompany name/parent pairs are flagged as duplicates. This is create-only, with no overwrite. Saves reuse authenticated existing CRUD endpoints and their BLL validation. Writes are sequential, not transactional: a failure stops the batch, preserving earlier successes. An uncertain network result must be checked in the destination before retrying. Download the results report before leaving the page.

Remote reads run in the browser, require the source's CORS support, and do not persist tokens. API results must be an array or use the specified dot-separated array path. XML record elements contain scalar child elements. Pagination is manual. OAuth, WSDL discovery, SOAP 1.2 and background import jobs are not implemented.

Validation tests: `node --test tests/import-data.test.cjs`.

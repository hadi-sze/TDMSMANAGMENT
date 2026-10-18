# TDMSMANAGMENT frontend

Next.js App Router, React, TypeScript, Tailwind CSS, Radix UI, and locally owned shadcn/ui components. The dashboard takes its layout from the supplied Cloudflare account-home reference and uses TDMSMANAGMENT branding. It does not communicate with your Cloudflare account.

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

## Included pages and behavior

| Route | Purpose |
| --- | --- |
| `/login` | Sign-in form, field validation, show/hide password, demo shortcut |
| `/dashboard` | Cloudflare-inspired account-home layout and three illustrated launch cards |
| `/dashboard/products` | Product CRUD, details, search, sorting, stock filters, pagination, CSV export |
| `/dashboard/companies` | Company directory, search, status filter, add/edit/delete forms |
| `/dashboard/analytics` | Actual stock and inventory-value summaries calculated from your products |
| `/dashboard/settings` | Account details, security/connection information, sign out |

The sidebar collapses on desktop and opens as a drawer on mobile. **Ctrl+K** / **Cmd+K** opens workspace search. Menus, dialogs, labels, and account tabs use Radix primitives through the shadcn/ui component files in `src/components/ui`. All illustrations are CSS/SVG; there are no remote images or font dependencies.

**Companies** expands to **All companies** and **Add company**. The company form includes name, address, companyID, companycode, and an active checkbox. The database-generated record ID appears when editing. The company table shows every field, with active/inactive filtering and ten rows per page. Company IDs are text identifiers; leading zeros are preserved. Demo mode saves companies to `.data/companies.json`; API mode uses the new .NET `/api/companies` controller.

The dev/build scripts use Next.js’s supported `--webpack` option because Turbopack’s CSS worker failed on this workstation.

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

## Verification — October 18, 2026

- Production build and TypeScript checks passed using Next.js 16.4.2.
- Browser verified sign-in, home-page actions, product creation/search/editing, command search, and navigation.
- Checked the dashboard at a 390px viewport and verified the mobile navigation drawer.
- HTTP checks passed authentication, same-origin protection, validation, complete demo CRUD, persistence, and logout.
- A production Next.js process successfully proxied CRUD through the existing ASP.NET Core API to SQL Server. The temporary verification record was removed.

`npm run format` formats the frontend source using Prettier.

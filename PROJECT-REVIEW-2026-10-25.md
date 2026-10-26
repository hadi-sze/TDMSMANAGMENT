# TDMSMANAGMENT project review — 2026-10-25

## Confirmed issues, ordered by priority

1. **High — direct backend requests bypass login.** The products, companies and subcompanies controllers have no authentication/authorization requirement, and Program.cs does not register authentication or authorization middleware. Unauthenticated GET requests to all three endpoints on port 5043 returned 200; the frontend companies endpoint correctly returned 401. The same unprotected controllers also expose create, update and delete operations (reviewed in source; no destructive live request was made). Current localhost binding limits exposure, but frontend login does not protect the backend itself. Add backend authentication and enforce authorization on every data endpoint, forwarding a validated user credential from the frontend. Sources: src/TDMSMANAGMENT.Api/Program.cs; Controllers/CompaniesController.cs:7; ProductsController.cs; SubCompaniesController.cs:7.

2. **Medium — demo autofill uses an obsolete password.** The login page decides whether to show the helper from environment variables, but accounts now live in SQL Server. The button always inserts the original development credentials. A live UI attempt returned the incorrect-password message. A legitimately changed password must not be reset to accommodate this helper. Remove the helper once account provisioning is complete, or replace it with non-credential guidance. Sources: frontend/src/app/login/page.tsx:7; frontend/src/components/login-form.tsx (demo autofill handler).

3. **Medium — login throttling combines all frontend users.** The backend policy keys on RemoteIpAddress and permits 20 requests per 15 minutes. Server-side Next.js requests reach it from the same frontend host, so successful sign-ins and password changes from different users consume a shared bucket. A small burst can deny legitimate users. Use an account-aware limit combined with trustworthy client-source limiting, and shared limiter storage for multiple instances. Do not simply trust arbitrary forwarded headers. Source: src/TDMSMANAGMENT.Api/Program.cs:24.

4. **Medium — API outages look like expired sessions.** getSession catches backend connectivity errors and returns null, as it does for invalid cookies. Protected pages therefore redirect users to login during an API outage, and API handlers return 401 instead of distinguishing service unavailability. Keep authorization fail-closed, but present a retryable 503/unavailable state for transport failures. Source: frontend/src/lib/auth.ts:58–76.

5. **Medium — production bootstrap accepts the published development password.** Startup only rejects an empty production TDMS_LOGIN_PASSWORD. Explicitly setting it to the published demo value provisions a predictable production account when the table is empty. The older frontend loginConfig safeguard is no longer used by credential verification. Reject that default during production provisioning. Sources: src/TDMSMANAGMENT.Api/Program.cs:33–37; frontend/src/lib/auth.ts:loginConfig.

## Incomplete features, not runtime defects

- Customers, production-company details and reports currently display placeholder/empty-state pages, not complete CRUD/reporting workflows. Source: frontend/src/components/dashboard.tsx:1390–1433.
- Google sign-in is disabled. Password recovery displays an administrator-contact message; there is no reset-token/email workflow.
- API/XML web-service imports run in the browser and require the remote service to allow CORS. They will not work against every service. No live external service was supplied for testing.

## Verification and limits

- Frontend TypeScript check passed.
- All 6 frontend import/demo-data tests passed.
- npm production-dependency audit reported zero known vulnerabilities at the time of this review. This is not a security guarantee.
- All 45 backend integration tests passed again after a fresh Release build. The frontend production build also passed.
- Direct API checks verified companies, subcompanies and products were reachable. Unauthenticated frontend access was rejected.
- Browser inspection verified login controls, required inputs and failed-login feedback. The demo credentials no longer authenticate, so authenticated navigation and account settings could not be visually retested with those credentials. No user password was changed or requested.
- Existing backend tests exercise CRUD and password-change behavior in disposable SQL test databases. No production/business record was created, edited or deleted by this review.
- Initial Debug rebuild hit DLL locks from the running backend. Release testing uses separate outputs to avoid stopping the user's running app.

This is a bounded code, test and runtime review, not a claim that every interaction or deployment configuration has been tested. Application code was not changed during this review. The authentication boundary should be fixed before broader deployment.


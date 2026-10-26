# Account management

Open **مدیریت حساب کاربری → حساب کاربری → تغییر رمز عبور**. Supply the current password, a different new password (12–256 characters), and its confirmation. Successful changes invalidate all existing sessions. Sign in again with the new password.

Authentication now uses the SQL Server `UserAccounts` table, even when frontend business data uses demo mode. Passwords are stored as salted PBKDF2-SHA512 hashes (210,000 iterations). A row-version column protects against simultaneous password updates.

The API provisions one account only when the account table is empty. Set `TDMS_LOGIN_EMAIL` and `TDMS_LOGIN_PASSWORD` in the **API process environment** before first startup. Development defaults are `admin@tdms.local` / `TdmsDemo!2026`. Production requires a configured password. Existing passwords are never overwritten by startup or environment changes.

Development startup applies pending EF migrations. For production, apply the `AddUserAccounts` migration before starting the API using the usual `dotnet ef database update --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api` deployment step. The frontend requires `TDMS_API_BASE_URL` and, in production, `TDMS_SESSION_SECRET` (at least 32 random characters).

Endpoints:

- `POST /api/account/verify`: email/password verification; returns a session stamp.
- `POST /api/account/change-password`: verifies email/current password before updating the hash and rotating the stamp. Rate limited together with verification to 20 requests per source IP per 15 minutes.
- `POST /api/account/validate-session`: validates the email and opaque session stamp.
- Frontend `POST /api/auth/change-password`: requires a valid signed session and same-origin request; derives the email from that session and checks password confirmation.

The frontend clears its cookie after a successful change. Older signed cookies are rejected on their next request because their stored stamp no longer matches. Keep the API behind HTTPS outside local development. Rate-limit state is per API process; deployments with multiple replicas should enforce a shared gateway limit.

Integration coverage uses disposable SQL Server test databases and verifies wrong-current-password rejection, password validation, persistence across requests, rejection of the old password, and session revocation. It does not change the development account password.

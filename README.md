# TDMSMANAGMENT — .NET 10 three-tier Product API

The solution, projects, and namespaces use `TDMSMANAGMENT`. The existing `ThreeTierProductsSample` database name is retained so the renamed application uses the database already set up.

## Next.js frontend

The `frontend/` folder includes a Next.js application with Radix UI and shadcn/ui components, a sign-in page, and a Cloudflare-inspired dashboard. It includes product CRUD screens, search, CSV export, inventory analytics, and account settings. Start with `cd frontend`, `npm install`, and `npm run dev`, then visit `http://127.0.0.1:3000` and use the demo shortcut. See [the frontend setup guide](frontend/README.md) to configure credentials and connect the .NET API.

## Companies

The sidebar includes an expandable **Companies → All companies / Add company** menu. The company directory includes search, active/inactive filtering, pagination, creation, editing, and deletion. The form defaults to active; inactive companies remain visible in the directory.

The new `Companies` SQL Server table is managed by the `AddCompanies` Code First migration. `id` is an automatically generated integer primary key. `companyID` is a separate text identifier, preserving letters and leading zeros. The JSON contract is:

```json
{
  "id": 1,
  "name": "Acme Industries",
  "address": "100 Market Street",
  "companyID": "CMP-001",
  "companycode": "ACME",
  "isActive": true
}
```

POST/PUT accept all fields except `id`. Name (200 characters), address (500), companyID (100), and companycode (50) are required, trimmed, nonblank strings. `isActive` must be an explicit JSON boolean; both true and false are valid. Company IDs and codes are not constrained to be unique. The menu is a navigation tree; this feature does not add company parent/child relationships.

`GET/POST /api/companies` and `GET/PUT/DELETE /api/companies/{id}` follow the same success, validation, and not-found conventions as Products. GET supports `page` and `pageSize` (1–100). Company entities and repositories live in DAL, DTOs and validation in BLL, and `CompaniesController` in API. The Next.js company endpoints enforce the existing sign-in session and proxy to the .NET API in API mode; demo mode uses a separate local companies data file.

Apply migrations on another machine:

```powershell
dotnet ef database update --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api
```

The complete idempotent schema script is `database/Migrations.sql`, including both Products and Companies. `database/InitialCreate.sql` remains the original Products-only baseline. The local `ThreeTierProductsSample` database has the company migration applied.

Verification: all **30 SQL Server integration tests** passed, including company CRUD, false/true active status, required-field validation, pagination, and existing Product regression tests. The frontend builds using Next.js’s supported Webpack builder; the scripts select it to avoid a local Turbopack worker failure. The DAL explicitly references `System.Security.Cryptography.Pkcs` 10.0.13 to resolve the NuGet audit build blocker in the prior transitive version.

A controller-based REST API using ASP.NET Core 10, EF Core 10.0.12, SQL Server, and Code First migrations. Open `TDMSMANAGMENT.slnx` with a .NET 10-compatible IDE, or use the CLI below.

## Architecture

```text
HTTP client
    ↓
Presentation: TDMSMANAGMENT.Api / ProductsController
    ↓ IProductService + DTOs
Business logic: TDMSMANAGMENT.BLL / ProductService
    ↓ IProductRepository
Data access: TDMSMANAGMENT.DAL / ProductRepository / AppDbContext
    ↓ EF Core SQL Server provider
SQL Server / ThreeTierProductsSample
```

```text
TDMSMANAGMENT.slnx
src/
  TDMSMANAGMENT.Api/                  Presentation and composition root
    Controllers/ProductsController.cs
    ErrorHandling/ApiExceptionHandler.cs
    Program.cs
    appsettings.json
  TDMSMANAGMENT.BLL/                  Validation, normalization, orchestration
    DTOs/ProductDtos.cs
    Exceptions/BusinessValidationException.cs
    Services/IProductService.cs
    Services/ProductService.cs
    DependencyInjection.cs
  TDMSMANAGMENT.DAL/                  POCO entity, EF model, persistence
    Models/Product.cs
    Data/AppDbContext.cs
    Repositories/IProductRepository.cs
    Repositories/ProductRepository.cs
    Migrations/                  Initial migration and model snapshot
    DependencyInjection.cs
tests/TDMSMANAGMENT.IntegrationTests/ Real SQL Server HTTP integration tests
scripts/Initialize-Database.ps1
database/InitialCreate.sql        Generated idempotent migration script
compose.yaml
requests.http
```

Controllers depend only on the BLL contract. The API references DAL in `Program.cs` solely to wire dependency injection. BLL consumes DAL repositories; DAL has no reference to BLL or API. These are three logical layers, running in one API process with SQL Server as the persistence server.

## Run with the existing local SQL Server

Prerequisites: .NET 10 SDK and SQL Server. The default development connection uses Windows authentication against `.\SQL25` and a dedicated `ThreeTierProductsSample` database. Change the server for your machine. Your development login must be allowed to create a database and apply its schema.

Run these commands from this folder in PowerShell:

```powershell
dotnet tool restore --configfile NuGet.Config
dotnet restore --configfile NuGet.Config
dotnet build --no-restore
dotnet ef database update --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api --no-build
dotnet dev-certs https --trust
dotnet run --project src/TDMSMANAGMENT.Api --no-build
```

Alternatively, `./scripts/Initialize-Database.ps1` restores, builds, and applies the migrations. Pass `-ConnectionString` to override the database for that invocation; configure the same connection for the API separately.

The API listens on `https://localhost:7043` and redirects `http://localhost:5043` to HTTPS. The development OpenAPI JSON document is at `https://localhost:7043/openapi/v1.json`. `requests.http` contains runnable sample requests. The OpenAPI endpoint serves JSON; no Swagger UI package is required.

To override the default connection for a terminal session:

```powershell
$env:ConnectionStrings__DefaultConnection = 'Server=YOUR_SERVER;Database=ThreeTierProductsSample;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True'
```

You can also use `dotnet user-secrets set 'ConnectionStrings:DefaultConnection' '<connection-string>' --project src/TDMSMANAGMENT.Api` for development. Supply secrets through your deployment's configuration/secret store in production. `TrustServerCertificate=True` is for a local development server; use a trusted certificate and `False` for deployment.

## Optional SQL Server using Docker

Requires Docker with Linux containers and a supported x86-64 host. The supplied SQL Server Developer image is for development/testing. Set a strong password locally; no password is committed:

```powershell
$env:MSSQL_SA_PASSWORD = Read-Host 'SQL Server development SA password' -MaskInput
docker compose up -d --wait
$env:ConnectionStrings__DefaultConnection = "Server=localhost,14333;Database=ThreeTierProductsSample;User Id=sa;Password=$env:MSSQL_SA_PASSWORD;Encrypt=True;TrustServerCertificate=True"
./scripts/Initialize-Database.ps1
dotnet run --project src/TDMSMANAGMENT.Api --no-build
```

The container port is bound to localhost and data persists in a named volume. `docker compose stop` stops the server while preserving its data. The SA account is a development bootstrap convenience; use a separate least-privileged application login for deployment.

## REST contract

| Method | Endpoint | Success | Other expected responses |
|---|---|---|---|
| GET | `/api/products?page=1&pageSize=20` | 200, ordered array (empty if no results) | 400 for invalid pagination |
| GET | `/api/products/{id}` | 200, product DTO | 404 |
| POST | `/api/products` | 201, product DTO and Location header | 400 |
| PUT | `/api/products/{id}` | 204 | 400, 404 |
| DELETE | `/api/products/{id}` | 204 | 404 |

POST and PUT accept the same write DTO:

```json
{
  "name": "Keyboard",
  "description": "Wireless keyboard",
  "price": 49.95,
  "stockQuantity": 12
}
```

Name, price, and stockQuantity are required. Name must have non-whitespace content and at most 200 characters. Description is optional with at most 2,000 characters. Price is nonnegative, fits SQL decimal(18,2), and has at most two fractional decimal places; excess precision is rejected rather than silently rounded. Stock quantity is a nonnegative 32-bit integer. Names/descriptions are trimmed; blank descriptions become null. The service assigns the UTC creation timestamp. Clients cannot change IDs or timestamps through the write DTO.

PUT replaces every editable field and leaves the creation timestamp intact. Writes use last-write-wins semantics; this example does not implement ETags or version tokens. Each write is a single atomic SQL command (or EF SaveChanges operation). Atomic update/delete row counts detect missing or concurrently deleted rows. List responses are ordered by ID, pageSize is bounded to 1–100, and offset overflow is rejected.

## Error handling and DI

`[ApiController]` handles malformed JSON, missing bodies, and DTO data annotations with HTTP 400 validation problem details. BLL repeats validation for non-HTTP callers and enforces decimal precision and pagination rules. `ApiExceptionHandler` translates BLL validation exceptions to 400, logs unexpected failures, and returns sanitized HTTP 500 problem details with a trace ID. SQL exception details and connection strings are not sent to clients. Other unhandled non-success responses use problem details as well.

DAL lets persistence exceptions reach the centralized handler instead of hiding them. EF database constraints independently reject negative prices and stock. Request cancellation tokens flow through every layer. DbContext, repository, and service are scoped per request; TimeProvider is a singleton.

Migrations run explicitly during setup/deployment, never automatically on API startup. This avoids multiple API instances competing to change the schema. The sample endpoints are unauthenticated; add the authentication and authorization appropriate to your application before exposing them publicly.

## Code First workflow

The POCO and fluent configuration in DAL are the source of the schema. The initial migration, designer, and snapshot are included. After changing the model:

```powershell
dotnet ef migrations add DescribeYourChange --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api --output-dir Migrations
dotnet ef migrations has-pending-model-changes --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api
dotnet ef database update --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api
```

For deployment, review and apply a generated idempotent SQL script using a schema-owner account:

```powershell
dotnet ef migrations script --idempotent --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api --output database/InitialCreate.sql
```

The script assumes the target database already exists. The `database update` command can create it when the login has permission. Do not replace migrations with `EnsureCreated`.

## Tests

```powershell
dotnet test --no-restore
```

Tests use the actual SQL Server provider and apply the included migration to a fresh `TDMSMANAGMENTTests_<random GUID>` database. The fixture deletes only that test database afterward. The sample application database is separate. The login must have database create/drop privileges. Tests default to `.\SQL25` with Windows authentication. For another SQL Server:

```powershell
$env:TDMSMANAGMENT_TEST_SQLSERVER = $env:ConnectionStrings__DefaultConnection
dotnet test --no-restore
```

The fixture overrides the database name even when this connection string specifies one. Coverage includes full HTTP CRUD, Location/status codes, persistence, normalization, unchanged creation timestamps, validation, malformed JSON, pagination bounds, direct BLL validation, SQL constraints, sanitized unexpected-error responses, and OpenAPI generation.

## Verified results

Verified on October 13, 2026 using .NET SDK 10.0.401 and the existing SQL Server instance `.\SQL25`:

- Build succeeded with zero warnings and zero errors.
- All 16 integration tests passed against SQL Server.
- Initial migration applied to `ThreeTierProductsSample`; the Products table is ready and empty.
- EF reported no pending model changes.
- Generated `database/InitialCreate.sql` from the migration with the idempotent option.

The Docker configuration is provided as an alternative setup and was not run on this machine, which has no Docker CLI installed.

## References

- [EF Core SQL Server 10.0.12 package](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore.SqlServer/10.0.12)
- [ASP.NET Core controller-based web APIs](https://learn.microsoft.com/en-us/aspnet/core/web-api/?view=aspnetcore-10.0)
- [EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)

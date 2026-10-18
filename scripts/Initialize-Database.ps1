param([string]$ConnectionString)
$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')
$previousConnection = $env:ConnectionStrings__DefaultConnection
try {
    if ($ConnectionString) { $env:ConnectionStrings__DefaultConnection = $ConnectionString }
    dotnet tool restore --configfile NuGet.Config
    if ($LASTEXITCODE -ne 0) { throw 'Tool restore failed.' }
    dotnet restore --configfile NuGet.Config
    if ($LASTEXITCODE -ne 0) { throw 'Package restore failed.' }
    dotnet build --no-restore
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
    dotnet ef database update --project src/TDMSMANAGMENT.DAL --startup-project src/TDMSMANAGMENT.Api --no-build
    if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
} finally {
    $env:ConnectionStrings__DefaultConnection = $previousConnection
    Pop-Location
}

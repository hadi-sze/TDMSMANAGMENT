using TDMSMANAGMENT.Api.ErrorHandling;
using TDMSMANAGMENT.BLL;
using TDMSMANAGMENT.DAL;
using TDMSMANAGMENT.BLL.Services;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
    context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier);
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured.");
builder.Services.AddDataAccess(connectionString);
builder.Services.AddBusinessLogic();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("account", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(15), QueueLimit = 0 }));
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var password = builder.Configuration["TDMS_LOGIN_PASSWORD"];
    if (string.IsNullOrWhiteSpace(password) && !app.Environment.IsDevelopment())
        throw new InvalidOperationException("Set TDMS_LOGIN_PASSWORD for initial account provisioning.");
    await scope.ServiceProvider.GetRequiredService<AccountService>().InitializeAsync(
        builder.Configuration["TDMS_LOGIN_EMAIL"] ?? "admin@tdms.local", password ?? "TdmsDemo!2026");
}
app.UseExceptionHandler();
app.UseRateLimiter();
app.UseStatusCodePages();
if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.UseHttpsRedirection();
app.MapControllers();
app.Run();

public partial class Program;

using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.BLL.Exceptions;
using TDMSMANAGMENT.BLL.Services;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Models;
using TDMSMANAGMENT.DAL.Repositories;

namespace TDMSMANAGMENT.IntegrationTests;

public sealed class SqlApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string databaseName = $"TDMSMANAGMENTTests_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var connection = new SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("TDMSMANAGMENT_TEST_SQLSERVER")
            ?? "Server=.\\SQL25;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True")
        {
            InitialCatalog = databaseName
        };
        builder.UseEnvironment("Development");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connection.ConnectionString));
        });
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // Only the unique database created by this fixture may be removed.
        if (db.Database.GetDbConnection().Database != databaseName)
            throw new InvalidOperationException("Refusing to delete an unexpected database.");
        await db.Database.EnsureDeletedAsync();
        await DisposeAsync();
    }
}

public sealed class ProductApiTests(SqlApiFactory factory) : IClassFixture<SqlApiFactory>
{
    private HttpClient CreateClient() => factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false
    });

    [Fact]
    public async Task CrudRoundTripPersistsDataAndReturnsCorrectStatuses()
    {
        using var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/products", new { name = "  Keyboard  ", description = " Wireless ", price = 49.95m, stockQuantity = 12 });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var product = (await response.Content.ReadFromJsonAsync<ProductDto>())!;
        Assert.True(product.Id > 0);
        Assert.Equal("Keyboard", product.Name);
        Assert.Equal("Wireless", product.Description);
        Assert.Equal(TimeSpan.Zero, product.CreatedAtUtc.Offset);
        Assert.EndsWith($"/api/products/{product.Id}", response.Headers.Location!.ToString());

        var fetched = await client.GetFromJsonAsync<ProductDto>(response.Headers.Location);
        Assert.Equal(product, fetched);
        var list = await client.GetFromJsonAsync<ProductDto[]>("/api/products?page=1&pageSize=100");
        Assert.Contains(list!, p => p.Id == product.Id);

        var update = await client.PutAsJsonAsync($"/api/products/{product.Id}", new { name = "Updated keyboard", description = " ", price = 39.99m, stockQuantity = 7 });
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        fetched = await client.GetFromJsonAsync<ProductDto>($"/api/products/{product.Id}");
        Assert.Equal("Updated keyboard", fetched!.Name);
        Assert.Equal(39.99m, fetched.Price);
        Assert.Equal(7, fetched.StockQuantity);
        Assert.Null(fetched.Description);
        Assert.Equal(product.CreatedAtUtc, fetched.CreatedAtUtc);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/products/{product.Id}")).StatusCode);
        var missing = await client.GetAsync($"/api/products/{product.Id}");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal("application/problem+json", missing.Content.Headers.ContentType!.MediaType);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/products/{product.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/products/{product.Id}", new { name = "Missing", price = 1, stockQuantity = 0 })).StatusCode);
    }

    [Theory]
    [InlineData("{\"name\":\" \",\"price\":1,\"stockQuantity\":0}")]
    [InlineData("{\"name\":\"Product\",\"price\":-1,\"stockQuantity\":0}")]
    [InlineData("{\"name\":\"Product\",\"price\":1.234,\"stockQuantity\":0}")]
    [InlineData("{\"name\":\"Product\",\"price\":1,\"stockQuantity\":-1}")]
    [InlineData("{\"name\":\"Product\"}")]
    [InlineData("null")]
    [InlineData("{invalid")]
    public async Task InvalidBodiesReturnValidationProblem(string json)
    {
        using var client = CreateClient();
        var response = await client.PostAsync("/api/products", new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(problem.RootElement.TryGetProperty("errors", out _));
        Assert.True(problem.RootElement.TryGetProperty("traceId", out _));
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("pageSize=101")]
    [InlineData("pageSize=0")]
    [InlineData("page=2147483647&pageSize=100")]
    public async Task InvalidPaginationReturnsBadRequest(string query)
    {
        using var client = CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/products?{query}")).StatusCode);
    }

    [Fact]
    public async Task BusinessLayerValidatesWhenCalledWithoutController()
    {
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IProductService>();
        var error = await Assert.ThrowsAsync<BusinessValidationException>(() => service.CreateAsync(
            new ProductWriteDto { Name = " ", Price = 1.234m, StockQuantity = -1 }, CancellationToken.None));
        Assert.Contains("Name", error.Errors.Keys);
        Assert.Contains("Price", error.Errors.Keys);
        Assert.Contains("StockQuantity", error.Errors.Keys);
    }

    [Fact]
    public async Task DatabaseEnforcesNonnegativeStock()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var error = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlRawAsync(
            "INSERT INTO Products (Name, Price, StockQuantity, CreatedAtUtc) VALUES (N'Invalid', 1, -1, SYSDATETIMEOFFSET())"));
        Assert.Equal(547, error.Number);
    }

    [Fact]
    public async Task UnexpectedPersistenceErrorReturnsSanitizedProblemDetails()
    {
        await using var failingApp = factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.RemoveAll<IProductRepository>();
            services.AddScoped<IProductRepository, FailingRepository>();
        }));
        using var client = failingApp.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        var response = await client.GetAsync("/api/products/1");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
        var json = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("sensitive-database-detail", json);
        using var problem = JsonDocument.Parse(json);
        Assert.True(problem.RootElement.TryGetProperty("traceId", out _));
    }

    private sealed class FailingRepository : IProductRepository
    {
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) => throw new InvalidOperationException("sensitive-database-detail");
        public Task<IReadOnlyList<Product>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Product> CreateAsync(Product product, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> UpdateAsync(int id, string name, string? description, decimal price, int stockQuantity, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    [Fact]
    public async Task OpenApiDocumentIncludesCrudRoutes()
    {
        using var client = CreateClient();
        var response = await client.GetAsync("/openapi/v1.json");
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var paths = document.RootElement.GetProperty("paths");
        Assert.True(paths.GetProperty("/api/products").TryGetProperty("post", out _));
        Assert.True(paths.GetProperty("/api/products/{id}").TryGetProperty("put", out _));
        Assert.True(paths.GetProperty("/api/products/{id}").TryGetProperty("delete", out _));
    }
}

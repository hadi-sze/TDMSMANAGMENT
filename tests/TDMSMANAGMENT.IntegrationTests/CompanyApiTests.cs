using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.BLL.Exceptions;
using TDMSMANAGMENT.BLL.Services;

namespace TDMSMANAGMENT.IntegrationTests;

public sealed class CompanyApiTests(SqlApiFactory factory) : IClassFixture<SqlApiFactory>
{
    private HttpClient CreateClient() => factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false
    });

    [Fact]
    public async Task CompanyCrudPersistsEveryFieldAndBooleanFalse()
    {
        using var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/companies", new
        {
            name = "  Acme Industries  ", address = "  100 Market Street  ", companyID = "  001234  ",
            companycode = "  ACME-01  ", isActive = false
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var company = (await response.Content.ReadFromJsonAsync<CompanyDto>())!;
        Assert.True(company.Id > 0);
        Assert.Equal("Acme Industries", company.Name);
        Assert.Equal("100 Market Street", company.Address);
        Assert.Equal("001234", company.CompanyID);
        Assert.Equal("ACME-01", company.CompanyCode);
        Assert.False(company.IsActive);
        Assert.EndsWith($"/api/companies/{company.Id}", response.Headers.Location!.ToString());
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(json.RootElement.TryGetProperty("companyID", out _));
        Assert.True(json.RootElement.TryGetProperty("companycode", out _));
        Assert.Equal(company, await client.GetFromJsonAsync<CompanyDto>(response.Headers.Location));
        Assert.Contains((await client.GetFromJsonAsync<CompanyDto[]>("/api/companies?pageSize=100"))!, item => item.Id == company.Id);

        var update = await client.PutAsJsonAsync($"/api/companies/{company.Id}", new
        {
            name = "Acme Updated", address = "200 New Street", companyID = "CMP-002", companycode = "NEW-02", isActive = true
        });
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        var updated = (await client.GetFromJsonAsync<CompanyDto>($"/api/companies/{company.Id}"))!;
        Assert.Equal("Acme Updated", updated.Name);
        Assert.Equal("200 New Street", updated.Address);
        Assert.Equal("CMP-002", updated.CompanyID);
        Assert.Equal("NEW-02", updated.CompanyCode);
        Assert.True(updated.IsActive);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/companies/{company.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/companies/{company.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/companies/{company.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/companies/{company.Id}", new
        {
            name = "Missing", address = "Address", companyID = "1", companycode = "M", isActive = false
        })).StatusCode);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("null")]
    [InlineData("{invalid")]
    [InlineData("{\"name\":\" \",\"address\":\"A\",\"companyID\":\"1\",\"companycode\":\"C\",\"isActive\":true}")]
    [InlineData("{\"name\":\"Name\",\"address\":\" \",\"companyID\":\"1\",\"companycode\":\"C\",\"isActive\":true}")]
    [InlineData("{\"name\":\"Name\",\"address\":\"A\",\"companyID\":\" \",\"companycode\":\"C\",\"isActive\":true}")]
    [InlineData("{\"name\":\"Name\",\"address\":\"A\",\"companyID\":\"1\",\"companycode\":\" \",\"isActive\":true}")]
    [InlineData("{\"name\":\"Name\",\"address\":\"A\",\"companyID\":\"1\",\"companycode\":\"C\"}")]
    [InlineData("{\"name\":\"Name\",\"address\":\"A\",\"companyID\":\"1\",\"companycode\":\"C\",\"isActive\":\"false\"}")]
    public async Task InvalidCompaniesReturnValidationProblem(string json)
    {
        using var client = CreateClient();
        var response = await client.PostAsync("/api/companies", new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("pageSize=101")]
    [InlineData("page=2147483647&pageSize=100")]
    public async Task CompanyPaginationIsValidated(string query)
    {
        using var client = CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/companies?{query}")).StatusCode);
    }

    [Fact]
    public async Task CompanyServiceValidatesNonHttpCallers()
    {
        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<ICompanyService>();
        var error = await Assert.ThrowsAsync<BusinessValidationException>(() => service.CreateAsync(new CompanyWriteDto
        {
            Name = " ", Address = " ", CompanyID = " ", CompanyCode = " ", IsActive = false
        }, CancellationToken.None));
        Assert.Equal(4, error.Errors.Count);
    }
}

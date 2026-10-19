using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.IntegrationTests;

public sealed class SubCompanyApiTests(SqlApiFactory factory) : IClassFixture<SqlApiFactory>
{
    private HttpClient CreateClient() => factory.CreateClient(new WebApplicationFactoryClientOptions
    { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
    private static async Task<CompanyDto> Parent(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/companies", new { name, address = "Address", companyID = "000123", companycode = "QA", isActive = true });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CompanyDto>())!;
    }

    [Fact]
    public async Task CrudReassignsParentFiltersAndProtectsParentDeletion()
    {
        using var client = CreateClient();
        var parent = await Parent(client, "Parent A");
        var other = await Parent(client, "Parent B");
        var created = await client.PostAsJsonAsync("/api/subcompanies", new { name = "  شعبه تهران  ", companyId = parent.Id, isActive = false });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var item = (await created.Content.ReadFromJsonAsync<SubCompanyDto>())!;
        Assert.Equal("شعبه تهران", item.Name);
        Assert.Equal(parent.Id, item.CompanyId);
        Assert.False(item.IsActive);
        Assert.EndsWith($"/api/subcompanies/{item.Id}", created.Headers.Location!.ToString());
        Assert.Equal(item, await client.GetFromJsonAsync<SubCompanyDto>(created.Headers.Location));
        Assert.Contains((await client.GetFromJsonAsync<SubCompanyDto[]>($"/api/subcompanies?companyId={parent.Id}"))!, s => s.Id == item.Id);
        Assert.Empty((await client.GetFromJsonAsync<SubCompanyDto[]>($"/api/subcompanies?companyId={other.Id}"))!);
        var conflict = await client.DeleteAsync($"/api/companies/{parent.Id}");
        Assert.Equal(HttpStatusCode.Conflict, conflict.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/companies/{parent.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PutAsJsonAsync($"/api/subcompanies/{item.Id}", new { name = "Updated branch", companyId = other.Id, isActive = true })).StatusCode);
        var updated = (await client.GetFromJsonAsync<SubCompanyDto>($"/api/subcompanies/{item.Id}"))!;
        Assert.True(updated.IsActive);
        Assert.Equal(other.Id, updated.CompanyId);
        Assert.Equal("Updated branch", updated.Name);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/companies/{parent.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/subcompanies/{item.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/subcompanies/{item.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync($"/api/subcompanies/{item.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/subcompanies/{item.Id}", new { name = "Missing", companyId = other.Id, isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/companies/{other.Id}")).StatusCode);
    }

    [Fact]
    public async Task ParentIsValidatedOnCreateAndUpdate()
    {
        using var client = CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/subcompanies", new { name = "Orphan", companyId = int.MaxValue, isActive = true })).StatusCode);
        var parent = await Parent(client, "Valid parent");
        var response = await client.PostAsJsonAsync("/api/subcompanies", new { name = "Branch", companyId = parent.Id, isActive = true });
        var item = (await response.Content.ReadFromJsonAsync<SubCompanyDto>())!;
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/subcompanies/{item.Id}", new { name = "Orphan update", companyId = int.MaxValue, isActive = true })).StatusCode);
        Assert.Equal(parent.Id, (await client.GetFromJsonAsync<SubCompanyDto>($"/api/subcompanies/{item.Id}"))!.CompanyId);
    }

    [Fact]
    public async Task ForeignKeyAlsoProtectsDirectDatabaseWrites()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.SubCompanies.Add(new SubCompany { Name = "Orphan", CompanyId = int.MaxValue, IsActive = true });
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("null")]
    [InlineData("{invalid")]
    [InlineData("{\"name\":\" \",\"companyId\":1,\"isActive\":true}")]
    [InlineData("{\"name\":\"Branch\",\"companyId\":0,\"isActive\":true}")]
    [InlineData("{\"name\":\"Branch\",\"companyId\":1}")]
    [InlineData("{\"name\":\"Branch\",\"companyId\":1,\"isActive\":\"false\"}")]
    public async Task InvalidInputReturnsBadRequest(string json)
    {
        using var client = CreateClient();
        var response = await client.PostAsync("/api/subcompanies", new StringContent(json, Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
    }
    [Theory]
    [InlineData("page=0")]
    [InlineData("pageSize=101")]
    [InlineData("page=2147483647&pageSize=100")]
    [InlineData("companyId=0")]
    public async Task InvalidQueryReturnsBadRequest(string query)
    {
        using var client = CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/subcompanies?{query}")).StatusCode);
    }
}

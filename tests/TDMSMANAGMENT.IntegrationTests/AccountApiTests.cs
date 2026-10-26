using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace TDMSMANAGMENT.IntegrationTests;

public sealed class AccountApiTests(SqlApiFactory factory) : IClassFixture<SqlApiFactory>
{
    [Fact]
    public async Task PasswordChangePersistsAndRevokesOldSessions()
    {
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        const string email = "admin@tdms.local";
        const string original = "TdmsDemo!2026";
        const string replacement = "Test-Changed!2026";
        var login = await client.PostAsJsonAsync("/api/account/verify", new { email, password = original });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = await login.Content.ReadFromJsonAsync<SessionResult>();
        Assert.NotNull(session);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/account/validate-session", new { email, stamp = session.Stamp })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/account/change-password", new { email, currentPassword = "wrong", newPassword = replacement })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/account/change-password", new { email, currentPassword = original, newPassword = "short" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/account/change-password", new { email, currentPassword = original, newPassword = original })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/account/change-password", new { email, currentPassword = original, newPassword = replacement })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/account/verify", new { email, password = original })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/account/validate-session", new { email, stamp = session.Stamp })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/account/verify", new { email, password = replacement })).StatusCode);
    }

    private sealed record SessionResult(Guid Stamp);
}

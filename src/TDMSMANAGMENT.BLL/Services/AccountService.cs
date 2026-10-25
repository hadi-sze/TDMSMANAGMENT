using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.BLL.Services;

public sealed class AccountService(AppDbContext db)
{
    private const int Iterations = 210_000;

    private static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA512, 64);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    private static bool Matches(string password, string stored)
    {
        var parts = stored.Split('.');
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, Convert.FromBase64String(parts[0]), Iterations, HashAlgorithmName.SHA512, 64);
        return CryptographicOperations.FixedTimeEquals(actual, Convert.FromBase64String(parts[1]));
    }

    public async Task InitializeAsync(string email, string password)
    {
        email = email.Trim().ToLowerInvariant();
        if (!await db.UserAccounts.AnyAsync())
        {
            db.UserAccounts.Add(new UserAccount { Email = email, PasswordHash = Hash(password) });
            await db.SaveChangesAsync();
        }
    }

    public async Task<Guid?> VerifyAsync(string email, string password, CancellationToken ct)
    {
        var user = await db.UserAccounts.SingleOrDefaultAsync(a => a.Email == email.Trim().ToLower(), ct);
        // Perform the same expensive calculation for unknown accounts.
        var hash = user?.PasswordHash ?? $"{Convert.ToBase64String(new byte[16])}.{Convert.ToBase64String(new byte[64])}";
        return Matches(password, hash) && user is not null ? user.SecurityStamp : null;
    }

    public Task<bool> ValidateSessionAsync(string email, Guid stamp, CancellationToken ct) =>
        db.UserAccounts.AnyAsync(a => a.Email == email && a.SecurityStamp == stamp, ct);

    public async Task<bool> ChangePasswordAsync(string email, string currentPassword, string newPassword, CancellationToken ct)
    {
        if (newPassword.Length < 12 || newPassword.Length > 256 || string.IsNullOrWhiteSpace(newPassword) || newPassword == currentPassword)
            throw new ArgumentException("رمز جدید باید بین ۱۲ تا ۲۵۶ نویسه و با رمز فعلی متفاوت باشد.");
        var user = await db.UserAccounts.SingleOrDefaultAsync(a => a.Email == email.Trim().ToLower(), ct);
        if (user is null || !Matches(currentPassword, user.PasswordHash)) return false;
        user.PasswordHash = Hash(newPassword);
        user.SecurityStamp = Guid.NewGuid();
        await db.SaveChangesAsync(ct);
        return true;
    }
}

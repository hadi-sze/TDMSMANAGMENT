using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.BLL.Services;

namespace TDMSMANAGMENT.Api.Controllers;

[ApiController]
[Route("api/account")]
[EnableRateLimiting("account")]
[RequestSizeLimit(8192)]
public sealed class AccountController(AccountService service) : ControllerBase
{
    public sealed record Credentials(
        [Required, EmailAddress, MaxLength(254)] string Email,
        [Required, MaxLength(256)] string Password);

    public sealed record PasswordChange(
        [Required, EmailAddress, MaxLength(254)] string Email,
        [Required, MaxLength(256)] string CurrentPassword,
        [Required, MinLength(12), MaxLength(256)] string NewPassword);

    [HttpPost("verify")]
    public async Task<IActionResult> Verify(Credentials request, CancellationToken ct)
    {
        var stamp = await service.VerifyAsync(request.Email, request.Password, ct);
        return stamp.HasValue ? Ok(new { stamp }) : Unauthorized();
    }

    public sealed record SessionCheck([Required, MaxLength(254)] string Email, Guid Stamp);

    [HttpPost("validate-session")]
    [DisableRateLimiting]
    public async Task<IActionResult> ValidateSession(SessionCheck request, CancellationToken ct) =>
        await service.ValidateSessionAsync(request.Email, request.Stamp, ct) ? NoContent() : Unauthorized();

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(PasswordChange request, CancellationToken ct)
    {
        try
        {
            return await service.ChangePasswordAsync(request.Email, request.CurrentPassword, request.NewPassword, ct)
                ? NoContent() : Unauthorized();
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { error = "اطلاعات حساب تغییر کرده است؛ دوباره وارد شوید." }); }
    }
}

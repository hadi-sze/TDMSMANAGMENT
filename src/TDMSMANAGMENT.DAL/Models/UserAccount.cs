namespace TDMSMANAGMENT.DAL.Models;

public sealed class UserAccount
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public Guid SecurityStamp { get; set; } = Guid.NewGuid();
    public byte[] RowVersion { get; set; } = [];
}

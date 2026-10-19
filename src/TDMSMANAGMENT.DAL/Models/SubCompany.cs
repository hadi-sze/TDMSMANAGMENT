namespace TDMSMANAGMENT.DAL.Models;

public sealed class SubCompany
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CompanyId { get; set; }
    public bool IsActive { get; set; }
    public Company Company { get; set; } = null!;
}

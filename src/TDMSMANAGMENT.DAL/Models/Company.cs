namespace TDMSMANAGMENT.DAL.Models;

public sealed class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string CompanyID { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public ICollection<SubCompany> SubCompanies { get; set; } = new List<SubCompany>();
}

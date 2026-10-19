using System.ComponentModel.DataAnnotations;
namespace TDMSMANAGMENT.BLL.DTOs;

public sealed class SubCompanyWriteDto
{
    [Required, StringLength(200)]
    public string Name { get; init; } = string.Empty;
    [Range(1, int.MaxValue)]
    public int CompanyId { get; init; }
    [Required]
    public bool? IsActive { get; init; }
}
public sealed record SubCompanyDto(int Id, string Name, int CompanyId, bool IsActive);

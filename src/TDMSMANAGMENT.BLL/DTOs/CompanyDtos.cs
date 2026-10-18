using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TDMSMANAGMENT.BLL.DTOs;

public sealed class CompanyWriteDto
{
    [Required, StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [Required, StringLength(500)]
    public string Address { get; init; } = string.Empty;

    [Required, StringLength(100)]
    public string CompanyID { get; init; } = string.Empty;

    [Required, StringLength(50), JsonPropertyName("companycode")]
    public string CompanyCode { get; init; } = string.Empty;

    [Required]
    public bool? IsActive { get; init; }
}

public sealed record CompanyDto(int Id, string Name, string Address, string CompanyID,
    [property: JsonPropertyName("companycode")] string CompanyCode, bool IsActive);

using System.ComponentModel.DataAnnotations;

namespace TDMSMANAGMENT.BLL.DTOs;

public sealed class ProductWriteDto
{
    [Required, StringLength(200)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Required, Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal? Price { get; init; }

    [Required, Range(0, int.MaxValue)]
    public int? StockQuantity { get; init; }
}

public sealed record ProductDto(int Id, string Name, string? Description, decimal Price, int StockQuantity, DateTimeOffset CreatedAtUtc);

namespace TDMSMANAGMENT.DAL.Models;

public sealed class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}

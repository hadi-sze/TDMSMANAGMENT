using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.DAL.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var product = modelBuilder.Entity<Product>();
        product.ToTable("Products", table =>
        {
            table.HasCheckConstraint("CK_Products_Price", "[Price] >= 0");
            table.HasCheckConstraint("CK_Products_StockQuantity", "[StockQuantity] >= 0");
        });
        product.HasKey(p => p.Id);
        product.Property(p => p.Name).HasMaxLength(200).IsRequired();
        product.Property(p => p.Description).HasMaxLength(2000);
        product.Property(p => p.Price).HasPrecision(18, 2);
        product.Property(p => p.CreatedAtUtc).IsRequired();
    }
}

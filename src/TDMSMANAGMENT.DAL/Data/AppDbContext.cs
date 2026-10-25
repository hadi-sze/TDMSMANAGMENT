using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.DAL.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<SubCompany> SubCompanies => Set<SubCompany>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var account = modelBuilder.Entity<UserAccount>();
        account.Property(a => a.Email).HasMaxLength(254).IsRequired();
        account.HasIndex(a => a.Email).IsUnique();
        account.Property(a => a.PasswordHash).HasMaxLength(512).IsRequired();
        account.Property(a => a.RowVersion).IsRowVersion();
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

        var company = modelBuilder.Entity<Company>();
        company.ToTable("Companies");
        company.HasKey(c => c.Id);
        company.Property(c => c.Name).HasMaxLength(200).IsRequired();
        company.Property(c => c.Address).HasMaxLength(500).IsRequired();
        company.Property(c => c.CompanyID).HasMaxLength(100).IsRequired();
        company.Property(c => c.CompanyCode).HasColumnName("companycode").HasMaxLength(50).IsRequired();
        company.Property(c => c.IsActive).IsRequired();

        var subCompany = modelBuilder.Entity<SubCompany>();
        subCompany.ToTable("SubCompanies");
        subCompany.HasKey(s => s.Id);
        subCompany.Property(s => s.Name).HasMaxLength(200).IsRequired();
        subCompany.Property(s => s.IsActive).IsRequired();
        subCompany.HasOne(s => s.Company).WithMany(c => c.SubCompanies)
            .HasForeignKey(s => s.CompanyId).OnDelete(DeleteBehavior.Restrict);
    }
}

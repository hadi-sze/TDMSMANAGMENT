using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.DAL.Repositories;

public sealed class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken) =>
        await db.Products.AsNoTracking().OrderBy(p => p.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Products.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id, cancellationToken);

    public async Task<Product> CreateAsync(Product product, CancellationToken cancellationToken)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);
        return product;
    }

    // Each command is atomic. The affected-row count also handles concurrent deletion.
    public async Task<bool> UpdateAsync(int id, string name, string? description, decimal price, int stockQuantity, CancellationToken cancellationToken) =>
        await db.Products.Where(p => p.Id == id).ExecuteUpdateAsync(setters => setters
            .SetProperty(p => p.Name, name)
            .SetProperty(p => p.Description, description)
            .SetProperty(p => p.Price, price)
            .SetProperty(p => p.StockQuantity, stockQuantity), cancellationToken) > 0;

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) =>
        await db.Products.Where(p => p.Id == id).ExecuteDeleteAsync(cancellationToken) > 0;
}

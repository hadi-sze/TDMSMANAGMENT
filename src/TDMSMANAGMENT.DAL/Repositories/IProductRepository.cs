using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.DAL.Repositories;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Product> CreateAsync(Product product, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, string name, string? description, decimal price, int stockQuantity, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

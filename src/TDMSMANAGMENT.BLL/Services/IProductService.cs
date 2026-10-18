using TDMSMANAGMENT.BLL.DTOs;

namespace TDMSMANAGMENT.BLL.Services;

public interface IProductService
{
    Task<IReadOnlyList<ProductDto>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<ProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<ProductDto> CreateAsync(ProductWriteDto request, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, ProductWriteDto request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

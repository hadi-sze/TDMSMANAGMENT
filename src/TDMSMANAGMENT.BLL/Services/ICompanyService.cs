using TDMSMANAGMENT.BLL.DTOs;

namespace TDMSMANAGMENT.BLL.Services;

public interface ICompanyService
{
    Task<IReadOnlyList<CompanyDto>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<CompanyDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<CompanyDto> CreateAsync(CompanyWriteDto request, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, CompanyWriteDto request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

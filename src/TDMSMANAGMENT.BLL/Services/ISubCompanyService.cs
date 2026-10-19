using TDMSMANAGMENT.BLL.DTOs;
namespace TDMSMANAGMENT.BLL.Services;

public interface ISubCompanyService
{
    Task<IReadOnlyList<SubCompanyDto>> GetAllAsync(int page, int pageSize, int? companyId, CancellationToken cancellationToken);
    Task<SubCompanyDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<SubCompanyDto> CreateAsync(SubCompanyWriteDto request, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, SubCompanyWriteDto request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

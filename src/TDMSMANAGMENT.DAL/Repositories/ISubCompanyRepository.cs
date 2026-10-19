using TDMSMANAGMENT.DAL.Models;
namespace TDMSMANAGMENT.DAL.Repositories;

public interface ISubCompanyRepository
{
    Task<IReadOnlyList<SubCompany>> GetAllAsync(int page, int pageSize, int? companyId, CancellationToken cancellationToken);
    Task<SubCompany?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<SubCompany> CreateAsync(SubCompany subCompany, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, SubCompany subCompany, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

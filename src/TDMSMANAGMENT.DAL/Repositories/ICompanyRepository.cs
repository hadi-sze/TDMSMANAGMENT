using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.DAL.Repositories;

public interface ICompanyRepository
{
    Task<IReadOnlyList<Company>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken);
    Task<Company?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Company> CreateAsync(Company company, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, Company company, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

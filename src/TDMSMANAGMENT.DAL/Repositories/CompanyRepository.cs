using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Models;

namespace TDMSMANAGMENT.DAL.Repositories;

public sealed class CompanyRepository(AppDbContext db) : ICompanyRepository
{
    public async Task<IReadOnlyList<Company>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken) =>
        await db.Companies.AsNoTracking().OrderBy(c => c.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);

    public Task<Company?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Companies.AsNoTracking().SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<Company> CreateAsync(Company company, CancellationToken cancellationToken)
    {
        db.Companies.Add(company);
        await db.SaveChangesAsync(cancellationToken);
        return company;
    }

    public async Task<bool> UpdateAsync(int id, Company company, CancellationToken cancellationToken) =>
        await db.Companies.Where(c => c.Id == id).ExecuteUpdateAsync(setters => setters
            .SetProperty(c => c.Name, company.Name)
            .SetProperty(c => c.Address, company.Address)
            .SetProperty(c => c.CompanyID, company.CompanyID)
            .SetProperty(c => c.CompanyCode, company.CompanyCode)
            .SetProperty(c => c.IsActive, company.IsActive), cancellationToken) > 0;

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) =>
        await db.Companies.Where(c => c.Id == id).ExecuteDeleteAsync(cancellationToken) > 0;
}

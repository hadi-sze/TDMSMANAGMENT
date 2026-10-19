using Microsoft.EntityFrameworkCore;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Models;
namespace TDMSMANAGMENT.DAL.Repositories;

public sealed class SubCompanyRepository(AppDbContext db) : ISubCompanyRepository
{
    public async Task<IReadOnlyList<SubCompany>> GetAllAsync(int page, int pageSize, int? companyId, CancellationToken cancellationToken)
    {
        var query = db.SubCompanies.AsNoTracking();
        if (companyId.HasValue) query = query.Where(s => s.CompanyId == companyId.Value);
        return await query.OrderBy(s => s.Id).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
    }
    public Task<SubCompany?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.SubCompanies.AsNoTracking().SingleOrDefaultAsync(s => s.Id == id, cancellationToken);
    public async Task<SubCompany> CreateAsync(SubCompany subCompany, CancellationToken cancellationToken)
    {
        db.SubCompanies.Add(subCompany);
        await db.SaveChangesAsync(cancellationToken);
        return subCompany;
    }
    public async Task<bool> UpdateAsync(int id, SubCompany subCompany, CancellationToken cancellationToken) =>
        await db.SubCompanies.Where(s => s.Id == id).ExecuteUpdateAsync(setters => setters
            .SetProperty(s => s.Name, subCompany.Name)
            .SetProperty(s => s.CompanyId, subCompany.CompanyId)
            .SetProperty(s => s.IsActive, subCompany.IsActive), cancellationToken) > 0;
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) =>
        await db.SubCompanies.Where(s => s.Id == id).ExecuteDeleteAsync(cancellationToken) > 0;
}

using System.ComponentModel.DataAnnotations;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.BLL.Exceptions;
using TDMSMANAGMENT.DAL.Models;
using TDMSMANAGMENT.DAL.Repositories;
namespace TDMSMANAGMENT.BLL.Services;

public sealed class SubCompanyService(ISubCompanyRepository repository, ICompanyRepository companies) : ISubCompanyService
{
    public async Task<IReadOnlyList<SubCompanyDto>> GetAllAsync(int page, int pageSize, int? companyId, CancellationToken cancellationToken)
    {
        if (page < 1 || pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new BusinessValidationException(new Dictionary<string, string[]> { ["pagination"] = ["Page must be positive, pageSize must be 1–100, and the offset must fit a 32-bit integer."] });
        if (companyId is <= 0)
            throw new BusinessValidationException(new Dictionary<string, string[]> { ["companyId"] = ["Company ID must be a positive record ID."] });
        return (await repository.GetAllAsync(page, pageSize, companyId, cancellationToken)).Select(Map).ToArray();
    }
    public async Task<SubCompanyDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var subCompany = await repository.GetByIdAsync(id, cancellationToken);
        return subCompany is null ? null : Map(subCompany);
    }
    public async Task<SubCompanyDto> CreateAsync(SubCompanyWriteDto request, CancellationToken cancellationToken) =>
        Map(await repository.CreateAsync(await ValidateAndMapAsync(request, cancellationToken), cancellationToken));
    public async Task<bool> UpdateAsync(int id, SubCompanyWriteDto request, CancellationToken cancellationToken) =>
        await repository.UpdateAsync(id, await ValidateAndMapAsync(request, cancellationToken), cancellationToken);
    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => repository.DeleteAsync(id, cancellationToken);

    private async Task<SubCompany> ValidateAndMapAsync(SubCompanyWriteDto request, CancellationToken cancellationToken)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);
        var errors = results.SelectMany(r => r.MemberNames.Select(member => (member, r.ErrorMessage)))
            .GroupBy(x => x.member).ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage ?? "Invalid value.").ToArray());
        if (string.IsNullOrWhiteSpace(request.Name)) errors[nameof(request.Name)] = ["Enter the subcompany name."];
        if (request.CompanyId > 0 && await companies.GetByIdAsync(request.CompanyId, cancellationToken) is null)
            errors[nameof(request.CompanyId)] = ["The selected parent company does not exist."];
        if (errors.Count > 0) throw new BusinessValidationException(errors);
        return new SubCompany { Name = request.Name.Trim(), CompanyId = request.CompanyId, IsActive = request.IsActive!.Value };
    }
    private static SubCompanyDto Map(SubCompany s) => new(s.Id, s.Name, s.CompanyId, s.IsActive);
}

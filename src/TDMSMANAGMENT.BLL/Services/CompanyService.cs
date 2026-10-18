using System.ComponentModel.DataAnnotations;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.BLL.Exceptions;
using TDMSMANAGMENT.DAL.Models;
using TDMSMANAGMENT.DAL.Repositories;

namespace TDMSMANAGMENT.BLL.Services;

public sealed class CompanyService(ICompanyRepository repository) : ICompanyService
{
    public async Task<IReadOnlyList<CompanyDto>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        if (page < 1 || pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new BusinessValidationException(new Dictionary<string, string[]>
            {
                ["pagination"] = ["Page must be positive, pageSize must be 1–100, and the offset must fit a 32-bit integer."]
            });
        return (await repository.GetAllAsync(page, pageSize, cancellationToken)).Select(Map).ToArray();
    }

    public async Task<CompanyDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var company = await repository.GetByIdAsync(id, cancellationToken);
        return company is null ? null : Map(company);
    }

    public async Task<CompanyDto> CreateAsync(CompanyWriteDto request, CancellationToken cancellationToken) =>
        Map(await repository.CreateAsync(ValidateAndMap(request), cancellationToken));

    public Task<bool> UpdateAsync(int id, CompanyWriteDto request, CancellationToken cancellationToken) =>
        repository.UpdateAsync(id, ValidateAndMap(request), cancellationToken);

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => repository.DeleteAsync(id, cancellationToken);

    private static Company ValidateAndMap(CompanyWriteDto request)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);
        var errors = results.SelectMany(result => result.MemberNames.Select(member => (member, result.ErrorMessage)))
            .GroupBy(x => x.member).ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage ?? "Invalid value.").ToArray());
        foreach (var (key, value) in new[] { (nameof(request.Name), request.Name), (nameof(request.Address), request.Address),
                     (nameof(request.CompanyID), request.CompanyID), (nameof(request.CompanyCode), request.CompanyCode) })
            if (string.IsNullOrWhiteSpace(value)) errors[key] = ["This field must contain non-whitespace characters."];
        if (errors.Count > 0) throw new BusinessValidationException(errors);
        return new Company
        {
            Name = request.Name.Trim(), Address = request.Address.Trim(), CompanyID = request.CompanyID.Trim(),
            CompanyCode = request.CompanyCode.Trim(), IsActive = request.IsActive!.Value
        };
    }

    private static CompanyDto Map(Company c) => new(c.Id, c.Name, c.Address, c.CompanyID, c.CompanyCode, c.IsActive);
}

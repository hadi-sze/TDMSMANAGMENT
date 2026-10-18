using System.ComponentModel.DataAnnotations;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.BLL.Exceptions;
using TDMSMANAGMENT.DAL.Models;
using TDMSMANAGMENT.DAL.Repositories;

namespace TDMSMANAGMENT.BLL.Services;

public sealed class ProductService(IProductRepository repository, TimeProvider clock) : IProductService
{
    public async Task<IReadOnlyList<ProductDto>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        if (page < 1 || pageSize is < 1 or > 100 || (long)(page - 1) * pageSize > int.MaxValue)
            throw new BusinessValidationException(new Dictionary<string, string[]>
            {
                ["pagination"] = ["Page must be positive, pageSize must be 1–100, and the offset must fit a 32-bit integer."]
            });
        return (await repository.GetAllAsync(page, pageSize, cancellationToken)).Select(Map).ToArray();
    }

    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var product = await repository.GetByIdAsync(id, cancellationToken);
        return product is null ? null : Map(product);
    }

    public async Task<ProductDto> CreateAsync(ProductWriteDto request, CancellationToken cancellationToken)
    {
        Validate(request);
        var product = new Product
        {
            Name = request.Name.Trim(), Description = NormalizeDescription(request.Description),
            Price = request.Price!.Value, StockQuantity = request.StockQuantity!.Value,
            CreatedAtUtc = clock.GetUtcNow()
        };
        return Map(await repository.CreateAsync(product, cancellationToken));
    }

    public Task<bool> UpdateAsync(int id, ProductWriteDto request, CancellationToken cancellationToken)
    {
        Validate(request);
        return repository.UpdateAsync(id, request.Name.Trim(), NormalizeDescription(request.Description),
            request.Price!.Value, request.StockQuantity!.Value, cancellationToken);
    }

    public Task<bool> DeleteAsync(int id, CancellationToken cancellationToken) => repository.DeleteAsync(id, cancellationToken);

    private static void Validate(ProductWriteDto request)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);
        var errors = results.SelectMany(result => result.MemberNames.Select(member => (member, result.ErrorMessage)))
            .GroupBy(x => x.member).ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage ?? "Invalid value.").ToArray());
        if (string.IsNullOrWhiteSpace(request.Name)) errors[nameof(request.Name)] = ["Name must contain non-whitespace characters."];
        if (request.Price is decimal price && decimal.Round(price, 2) != price)
            errors[nameof(request.Price)] = ["Price must have at most two decimal places."];
        if (errors.Count > 0) throw new BusinessValidationException(errors);
    }

    private static string? NormalizeDescription(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static ProductDto Map(Product p) => new(p.Id, p.Name, p.Description, p.Price, p.StockQuantity, p.CreatedAtUtc);
}

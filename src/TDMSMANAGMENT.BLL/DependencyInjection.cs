using Microsoft.Extensions.DependencyInjection;
using TDMSMANAGMENT.BLL.Services;

namespace TDMSMANAGMENT.BLL;

public static class DependencyInjection
{
    public static IServiceCollection AddBusinessLogic(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICompanyService, CompanyService>();
        return services;
    }
}

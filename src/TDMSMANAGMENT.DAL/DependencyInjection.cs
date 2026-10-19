using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TDMSMANAGMENT.DAL.Data;
using TDMSMANAGMENT.DAL.Repositories;

namespace TDMSMANAGMENT.DAL;

public static class DependencyInjection
{
    public static IServiceCollection AddDataAccess(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<ISubCompanyRepository, SubCompanyRepository>();
        return services;
    }
}

using Microsoft.AspNetCore.Mvc;
using TDMSMANAGMENT.BLL.DTOs;
using TDMSMANAGMENT.BLL.Services;

namespace TDMSMANAGMENT.Api.Controllers;

[ApiController]
[Route("api/subcompanies")]
public sealed class SubCompaniesController(ISubCompanyService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<SubCompanyDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<SubCompanyDto>>> GetAll(CancellationToken cancellationToken, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] int? companyId = null) =>
        Ok(await service.GetAllAsync(page, pageSize, companyId, cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType<SubCompanyDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SubCompanyDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var company = await service.GetByIdAsync(id, cancellationToken);
        return company is null ? NotFound() : Ok(company);
    }

    [HttpPost]
    [ProducesResponseType<SubCompanyDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SubCompanyDto>> Create(SubCompanyWriteDto request, CancellationToken cancellationToken)
    {
        var company = await service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = company.Id }, company);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, SubCompanyWriteDto request, CancellationToken cancellationToken) =>
        await service.UpdateAsync(id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken) =>
        await service.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
}

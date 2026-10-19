using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using TDMSMANAGMENT.BLL.Exceptions;

namespace TDMSMANAGMENT.Api.ErrorHandling;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger, IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        ProblemDetails problem;
        if (exception is BusinessValidationException validation)
        {
            problem = new ValidationProblemDetails(validation.Errors)
            {
                Status = StatusCodes.Status400BadRequest, Title = "One or more validation errors occurred."
            };
        }
        else if (exception is SqlException { Number: 547 } || exception is DbUpdateException { InnerException: SqlException { Number: 547 } })
        {
            problem = new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict, Title = "A related record prevents this operation.",
                Detail = "Check the parent company. Remove or reassign its subcompanies before deleting a company."
            };
        }
        else
        {
            logger.LogError(exception, "Unhandled request error. TraceId: {TraceId}", context.TraceIdentifier);
            problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError, Title = "An unexpected error occurred.",
                Detail = "Please retry later. Contact support with the traceId if the problem persists."
            };
        }
        context.Response.StatusCode = problem.Status!.Value;
        await problemDetails.WriteAsync(new ProblemDetailsContext { HttpContext = context, ProblemDetails = problem });
        return true;
    }
}

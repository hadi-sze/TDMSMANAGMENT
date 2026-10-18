namespace TDMSMANAGMENT.BLL.Exceptions;

public sealed class BusinessValidationException(IDictionary<string, string[]> errors) : Exception("One or more business rules failed.")
{
    public IDictionary<string, string[]> Errors { get; } = errors;
}

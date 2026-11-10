using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartBill.Api.Controllers;

[ApiController]
[Authorize]
public abstract class ApiControllerBase : ControllerBase
{
    // Reads the shop id from the login token; never returns null
    protected int ShopId =>
        int.TryParse(User.FindFirst("shopId")?.Value, out var id)
            ? id
            : throw new UnauthorizedAccessException("Your session has expired. Please log in again.");
}
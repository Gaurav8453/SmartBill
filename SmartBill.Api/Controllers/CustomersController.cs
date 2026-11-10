using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using SmartBill.Api.Models;

namespace SmartBill.Api.Controllers;

[Route("api/customers")]
public class CustomersController(IDbConnection db) : ApiControllerBase
{
    public record CustomerRequest(string Name, string? Phone, string? Gstin, string StateCode);

    [HttpGet]
    public async Task<IEnumerable<CustomerDto>> GetAll() =>
        await db.QueryAsync<CustomerDto>(@"
            SELECT Id, Name, Phone, Gstin, StateCode
            FROM Customers WHERE ShopId = @ShopId ORDER BY Name", new { ShopId });

    [HttpPost]
    public async Task<IActionResult> Create(CustomerRequest c)
    {
        if (Validate(c) is string error) return BadRequest(new { error });
        var id = await db.ExecuteScalarAsync<int>(@"
            INSERT INTO Customers (ShopId, Name, Phone, Gstin, StateCode) OUTPUT INSERTED.Id
            VALUES (@ShopId, @Name, @Phone, @Gstin, @StateCode)", Params(c));
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CustomerRequest c)
    {
        if (Validate(c) is string error) return BadRequest(new { error });
        var args = Params(c);
        args.Add("Id", id);
        var rows = await db.ExecuteAsync(@"
            UPDATE Customers SET Name = @Name, Phone = @Phone, Gstin = @Gstin, StateCode = @StateCode
            WHERE Id = @Id AND ShopId = @ShopId", args);
        return rows == 0 ? NotFound(new { error = "Customer not found." }) : NoContent();
    }

    private DynamicParameters Params(CustomerRequest c)
    {
        var args = new DynamicParameters();
        args.Add("ShopId", ShopId);
        args.Add("Name", c.Name.Trim());
        args.Add("Phone", string.IsNullOrWhiteSpace(c.Phone) ? null : c.Phone.Trim());
        args.Add("Gstin", string.IsNullOrWhiteSpace(c.Gstin) ? null : c.Gstin.Trim().ToUpperInvariant());
        args.Add("StateCode", c.StateCode);
        return args;
    }

    private static string? Validate(CustomerRequest c)
    {
        if (string.IsNullOrWhiteSpace(c.Name)) return "Customer name is required.";
        if (c.StateCode.Length != 2 || !c.StateCode.All(char.IsDigit)) return "Please choose a valid state.";
        if (!string.IsNullOrWhiteSpace(c.Gstin) && c.Gstin.Trim().Length != 15) return "GSTIN must be 15 characters.";
        return null;
    }
}
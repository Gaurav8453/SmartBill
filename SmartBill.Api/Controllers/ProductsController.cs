using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using SmartBill.Api.Models;

namespace SmartBill.Api.Controllers;

[Route("api/products")]
public class ProductsController(IDbConnection db) : ApiControllerBase
{
    // GST 2.0 rates (from 22 Sep 2025). 0.25% and 3% are special rates for diamonds and gold.
    private static readonly decimal[] ValidGstRates = [0m, 0.25m, 3m, 5m, 18m, 40m];

    public record ProductRequest(string Name, string? HsnCode, string? Unit, decimal Price,
                                 decimal GstRate, decimal StockQty, decimal LowStockLevel);

    [HttpGet]
    public async Task<IEnumerable<ProductDto>> GetAll() =>
        await db.QueryAsync<ProductDto>(@"
            SELECT Id, Name, HsnCode, Unit, Price, GstRate, StockQty, LowStockLevel
            FROM Products WHERE ShopId = @ShopId AND IsActive = 1
            ORDER BY Name", new { ShopId });

    [HttpPost]
    public async Task<IActionResult> Create(ProductRequest p)
    {
        if (Validate(p) is string error) return BadRequest(new { error });
        var id = await db.ExecuteScalarAsync<int>(@"
            INSERT INTO Products (ShopId, Name, HsnCode, Unit, Price, GstRate, StockQty, LowStockLevel)
            OUTPUT INSERTED.Id
            VALUES (@ShopId, @Name, @HsnCode, @Unit, @Price, @GstRate, @StockQty, @LowStockLevel)",
            Params(p));
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProductRequest p)
    {
        if (Validate(p) is string error) return BadRequest(new { error });
        var args = Params(p);
        args.Add("Id", id);
        var rows = await db.ExecuteAsync(@"
            UPDATE Products SET Name = @Name, HsnCode = @HsnCode, Unit = @Unit, Price = @Price,
                   GstRate = @GstRate, StockQty = @StockQty, LowStockLevel = @LowStockLevel
            WHERE Id = @Id AND ShopId = @ShopId", args);
        return rows == 0 ? NotFound(new { error = "Product not found." }) : NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        // Soft delete, so old invoices still reference the product
        var rows = await db.ExecuteAsync(
            "UPDATE Products SET IsActive = 0 WHERE Id = @id AND ShopId = @ShopId", new { id, ShopId });
        return rows == 0 ? NotFound(new { error = "Product not found." }) : NoContent();
    }

    private DynamicParameters Params(ProductRequest p)
    {
        var args = new DynamicParameters();
        args.Add("ShopId", ShopId);
        args.Add("Name", p.Name.Trim());
        args.Add("HsnCode", string.IsNullOrWhiteSpace(p.HsnCode) ? null : p.HsnCode.Trim());
        args.Add("Unit", string.IsNullOrWhiteSpace(p.Unit) ? "pcs" : p.Unit.Trim());
        args.Add("Price", p.Price);
        args.Add("GstRate", p.GstRate);
        args.Add("StockQty", p.StockQty);
        args.Add("LowStockLevel", p.LowStockLevel);
        return args;
    }

    private static string? Validate(ProductRequest p)
    {
        if (string.IsNullOrWhiteSpace(p.Name)) return "Product name is required.";
        if (p.Price < 0) return "Price cannot be negative.";
        if (p.StockQty < 0 || p.LowStockLevel < 0) return "Stock values cannot be negative.";
        if (!ValidGstRates.Contains(p.GstRate)) return "GST rate must be 0, 0.25, 3, 5, 18 or 40.";
        return null;
    }
}
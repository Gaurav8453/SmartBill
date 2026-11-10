using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using SmartBill.Api.Models;

namespace SmartBill.Api.Controllers;

[Route("api/dashboard")]
public class DashboardController(IDbConnection db) : ApiControllerBase
{
    [HttpGet]
    public async Task<DashboardDto> Get()
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var dashboard = await db.QuerySingleAsync<DashboardDto>(@"
            SELECT
              (SELECT ISNULL(SUM(GrandTotal), 0) FROM Invoices WHERE ShopId = @ShopId AND InvoiceDate = @today) AS TodaySales,
              (SELECT ISNULL(SUM(GrandTotal), 0) FROM Invoices WHERE ShopId = @ShopId AND InvoiceDate >= @monthStart) AS MonthSales,
              (SELECT COUNT(*) FROM Invoices WHERE ShopId = @ShopId AND InvoiceDate >= @monthStart) AS InvoicesThisMonth,
              (SELECT COUNT(*) FROM Products WHERE ShopId = @ShopId AND IsActive = 1) AS ProductCount,
              (SELECT COUNT(*) FROM Products WHERE ShopId = @ShopId AND IsActive = 1 AND StockQty <= LowStockLevel) AS LowStockCount",
            new { ShopId, today, monthStart });

        dashboard.RecentInvoices = (await db.QueryAsync<InvoiceListItemDto>(@"
            SELECT TOP 5 i.Id, i.InvoiceNo, i.InvoiceDate, c.Name AS CustomerName, i.IsInterState, i.GrandTotal
            FROM Invoices i LEFT JOIN Customers c ON c.Id = i.CustomerId
            WHERE i.ShopId = @ShopId
            ORDER BY i.Id DESC", new { ShopId })).ToList();

        return dashboard;
    }
}
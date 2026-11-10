using System.Data;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using SmartBill.Api.Models;

namespace SmartBill.Api.Controllers;

[Route("api/invoices")]
public class InvoicesController(IDbConnection db) : ApiControllerBase
{
    public record ItemRequest(int ProductId, decimal Qty);
    public record CreateInvoiceRequest(int? CustomerId, List<ItemRequest>? Items);

    private class ProductRow
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string? HsnCode { get; set; }
        public decimal Price { get; set; }
        public decimal GstRate { get; set; }
        public decimal StockQty { get; set; }
    }

    private class LineRow
    {
        public int InvoiceId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = "";
        public string? HsnCode { get; set; }
        public decimal Qty { get; set; }
        public decimal Price { get; set; }
        public decimal GstRate { get; set; }
        public decimal TaxableAmount { get; set; }
        public decimal GstAmount { get; set; }
        public decimal LineTotal { get; set; }
    }

    private static decimal Round2(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    [HttpGet]
    public async Task<IEnumerable<InvoiceListItemDto>> List() =>
        await db.QueryAsync<InvoiceListItemDto>(@"
            SELECT i.Id, i.InvoiceNo, i.InvoiceDate, c.Name AS CustomerName, i.IsInterState, i.GrandTotal
            FROM Invoices i LEFT JOIN Customers c ON c.Id = i.CustomerId
            WHERE i.ShopId = @ShopId
            ORDER BY i.Id DESC", new { ShopId });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var invoice = await db.QuerySingleOrDefaultAsync<InvoiceDetailDto>(@"
            SELECT i.Id, i.InvoiceNo, i.InvoiceDate, i.IsInterState, i.SubTotal, i.Cgst, i.Sgst, i.Igst, i.GrandTotal,
                   c.Name AS CustomerName, c.Phone AS CustomerPhone, c.Gstin AS CustomerGstin, c.StateCode AS CustomerStateCode,
                   s.Name AS ShopName, s.Gstin AS ShopGstin, s.Address AS ShopAddress, s.Phone AS ShopPhone, s.StateCode AS ShopStateCode
            FROM Invoices i
            JOIN Shops s ON s.Id = i.ShopId
            LEFT JOIN Customers c ON c.Id = i.CustomerId
            WHERE i.Id = @id AND i.ShopId = @ShopId", new { id, ShopId });

        if (invoice is null) return NotFound(new { error = "Invoice not found." });

        invoice.Items = (await db.QueryAsync<InvoiceItemDto>(@"
            SELECT ProductName, HsnCode, Qty, Price, GstRate, TaxableAmount, GstAmount, LineTotal
            FROM InvoiceItems WHERE InvoiceId = @id ORDER BY Id", new { id })).ToList();

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateInvoiceRequest req)
    {
        if (req.Items is null || req.Items.Count == 0) return BadRequest(new { error = "Add at least one item." });
        if (req.Items.Any(i => i.Qty <= 0)) return BadRequest(new { error = "Quantity must be greater than zero." });

        // Merge duplicate lines for the same product
        var items = req.Items.GroupBy(i => i.ProductId)
                             .Select(g => new ItemRequest(g.Key, g.Sum(x => x.Qty)))
                             .ToList();

        db.Open();
        using var tx = db.BeginTransaction();

        var shopState = await db.ExecuteScalarAsync<string>(
            "SELECT StateCode FROM Shops WHERE Id = @ShopId", new { ShopId }, tx);

        string? customerState = null;
        if (req.CustomerId is int customerId)
        {
            customerState = await db.ExecuteScalarAsync<string?>(
                "SELECT StateCode FROM Customers WHERE Id = @customerId AND ShopId = @ShopId",
                new { customerId, ShopId }, tx);
            if (customerState is null) return BadRequest(new { error = "Customer not found." });
        }

        // Inter-state sale => IGST; same state (or walk-in) => CGST + SGST
        var isInterState = customerState != null && customerState != shopState;

        var ids = items.Select(i => i.ProductId).ToArray();
        var products = (await db.QueryAsync<ProductRow>(@"
            SELECT Id, Name, HsnCode, Price, GstRate, StockQty
            FROM Products WITH (UPDLOCK, ROWLOCK)
            WHERE ShopId = @ShopId AND IsActive = 1 AND Id IN @ids",
            new { ShopId, ids }, tx)).ToDictionary(p => p.Id);

        var lines = new List<LineRow>();
        decimal subTotal = 0, totalGst = 0;

        foreach (var item in items)
        {
            if (!products.TryGetValue(item.ProductId, out var p))
                return BadRequest(new { error = $"Product {item.ProductId} not found." });
            if (p.StockQty < item.Qty)
                return BadRequest(new { error = $"Not enough stock for '{p.Name}'. Available: {p.StockQty:0.##}." });

            var taxable = Round2(item.Qty * p.Price);
            var gst = Round2(taxable * p.GstRate / 100);
            subTotal += taxable;
            totalGst += gst;

            lines.Add(new LineRow
            {
                ProductId = p.Id, ProductName = p.Name, HsnCode = p.HsnCode, Qty = item.Qty,
                Price = p.Price, GstRate = p.GstRate, TaxableAmount = taxable,
                GstAmount = gst, LineTotal = taxable + gst
            });
        }

        decimal cgst = 0, sgst = 0, igst = 0;
        if (isInterState) igst = totalGst;
        else { cgst = Round2(totalGst / 2); sgst = totalGst - cgst; }

        var invoiceDate = DateTime.Today;
        var count = await db.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM Invoices WITH (UPDLOCK, HOLDLOCK)
            WHERE ShopId = @ShopId AND YEAR(InvoiceDate) = @year",
            new { ShopId, year = invoiceDate.Year }, tx);
        var invoiceNo = $"INV-{invoiceDate.Year}-{count + 1:D5}";
        var grandTotal = subTotal + totalGst;

        var invoiceId = await db.ExecuteScalarAsync<int>(@"
            INSERT INTO Invoices (ShopId, CustomerId, InvoiceNo, InvoiceDate, IsInterState,
                                  SubTotal, Cgst, Sgst, Igst, GrandTotal)
            OUTPUT INSERTED.Id
            VALUES (@ShopId, @CustomerId, @invoiceNo, @invoiceDate, @isInterState,
                    @subTotal, @cgst, @sgst, @igst, @grandTotal)",
            new { ShopId, req.CustomerId, invoiceNo, invoiceDate, isInterState,
                  subTotal, cgst, sgst, igst, grandTotal }, tx);

        lines.ForEach(l => l.InvoiceId = invoiceId);
        await db.ExecuteAsync(@"
            INSERT INTO InvoiceItems (InvoiceId, ProductId, ProductName, HsnCode, Qty, Price,
                                      GstRate, TaxableAmount, GstAmount, LineTotal)
            VALUES (@InvoiceId, @ProductId, @ProductName, @HsnCode, @Qty, @Price,
                    @GstRate, @TaxableAmount, @GstAmount, @LineTotal)", lines, tx);

        await db.ExecuteAsync(
            "UPDATE Products SET StockQty = StockQty - @Qty WHERE Id = @ProductId AND ShopId = @ShopId",
            items.Select(i => new { i.Qty, i.ProductId, ShopId }), tx);

        tx.Commit();
        return Ok(new { invoiceId, invoiceNo, subTotal, cgst, sgst, igst, grandTotal });
    }
}
namespace SmartBill.Api.Models;

public record AuthResponse(string Token, string FullName, string ShopName, string StateCode);

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? HsnCode { get; set; }
    public string Unit { get; set; } = "pcs";
    public decimal Price { get; set; }
    public decimal GstRate { get; set; }
    public decimal StockQty { get; set; }
    public decimal LowStockLevel { get; set; }
    public bool IsLowStock => StockQty <= LowStockLevel;
}

public class CustomerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Phone { get; set; }
    public string? Gstin { get; set; }
    public string StateCode { get; set; } = "";
}

public class InvoiceListItemDto
{
    public int Id { get; set; }
    public string InvoiceNo { get; set; } = "";
    public DateTime InvoiceDate { get; set; }
    public string? CustomerName { get; set; }
    public bool IsInterState { get; set; }
    public decimal GrandTotal { get; set; }
}

public class InvoiceItemDto
{
    public string ProductName { get; set; } = "";
    public string? HsnCode { get; set; }
    public decimal Qty { get; set; }
    public decimal Price { get; set; }
    public decimal GstRate { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal GstAmount { get; set; }
    public decimal LineTotal { get; set; }
}

public class InvoiceDetailDto
{
    public int Id { get; set; }
    public string InvoiceNo { get; set; } = "";
    public DateTime InvoiceDate { get; set; }
    public bool IsInterState { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Cgst { get; set; }
    public decimal Sgst { get; set; }
    public decimal Igst { get; set; }
    public decimal GrandTotal { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerGstin { get; set; }
    public string? CustomerStateCode { get; set; }
    public string ShopName { get; set; } = "";
    public string? ShopGstin { get; set; }
    public string? ShopAddress { get; set; }
    public string? ShopPhone { get; set; }
    public string ShopStateCode { get; set; } = "";
    public List<InvoiceItemDto> Items { get; set; } = new();
}

public class DashboardDto
{
    public decimal TodaySales { get; set; }
    public decimal MonthSales { get; set; }
    public int InvoicesThisMonth { get; set; }
    public int ProductCount { get; set; }
    public int LowStockCount { get; set; }
    public List<InvoiceListItemDto> RecentInvoices { get; set; } = new();
}
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;

namespace SmartBill.Api.Infrastructure;

public static class DbInitializer
{
    public static void Initialize(string connectionString, bool seedDemoData)
    {
        var csb = new SqlConnectionStringBuilder(connectionString);
        var dbName = csb.InitialCatalog;
        if (string.IsNullOrWhiteSpace(dbName))
            throw new InvalidOperationException("The connection string must include Database=SmartBill.");

        // 1. Create the database if it does not exist
        csb.InitialCatalog = "master";
        using (var master = new SqlConnection(csb.ConnectionString))
        {
            master.Execute($"IF DB_ID(N'{dbName}') IS NULL CREATE DATABASE [{dbName}];");
        }

        // 2. Create tables
        using var db = new SqlConnection(connectionString);
        db.Open();
        foreach (var batch in Regex.Split(Schema, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(batch)) db.Execute(batch);
        }

        // 3. Demo data (only when the database is empty)
        if (seedDemoData) SeedDemoData(db);
    }

    private static void SeedDemoData(SqlConnection db)
    {
        if (db.ExecuteScalar<int>("SELECT COUNT(*) FROM Shops") > 0) return;

        using var tx = db.BeginTransaction();

        var shopId = db.ExecuteScalar<int>(@"
            INSERT INTO Shops (Name, Gstin, StateCode, Address, Phone) OUTPUT INSERTED.Id
            VALUES (N'Gaurav Electronics', '29ABCDE1234F1Z5', '29',
                    N'12, MG Road, Bengaluru, Karnataka 560001', '9876543210')",
            transaction: tx);

        db.Execute(@"
            INSERT INTO Users (ShopId, Email, PasswordHash, FullName)
            VALUES (@shopId, 'demo@smartbill.com', @hash, N'Demo Owner')",
            new { shopId, hash = BCrypt.Net.BCrypt.HashPassword("Demo@1234") }, tx);

        db.Execute(@"
            INSERT INTO Products (ShopId, Name, HsnCode, Unit, Price, GstRate, StockQty, LowStockLevel) VALUES
            (@shopId, N'Smartphone 128GB',    '8517', 'pcs', 12999.00, 18,  25,  5),
            (@shopId, N'Wireless Earphones',  '8518', 'pcs',   899.00, 18,  60, 10),
            (@shopId, N'Power Bank 10000mAh', '8507', 'pcs',  1499.00, 18,  40,  8),
            (@shopId, N'Fast Charger 33W',    '8504', 'pcs',   699.00, 18,  75, 15),
            (@shopId, N'USB-C Cable 1m',      '8544', 'pcs',   249.00, 18, 150, 25),
            (@shopId, N'HDMI Cable 1.5m',     '8544', 'pcs',   349.00, 18,  80, 15),
            (@shopId, N'Wireless Mouse',      '8471', 'pcs',   599.00, 18,  45, 10),
            (@shopId, N'LED Monitor 24 inch', '8528', 'pcs',  8999.00, 18,  12,  3),
            (@shopId, N'Split AC 1.5 Ton',    '8415', 'pcs', 32990.00, 18,   2,  3),
            (@shopId, N'Digital Thermometer', '9025', 'pcs',   199.00,  5,  30, 10)",
            new { shopId }, tx);

        db.Execute(@"
            INSERT INTO Customers (ShopId, Name, Phone, Gstin, StateCode) VALUES
            (@shopId, N'Ravi Sharma',          '9845012345', NULL,              '29'),
            (@shopId, N'Sri Lakshmi Traders',  '9886054321', '29AAFCS1234K1Z2', '29'),
            (@shopId, N'Chennai Mobile World', '9444098765', '33AABCC5678L1Z9', '33'),
            (@shopId, N'Pune Tech Solutions',  '9822011223', '27AACCP4321M1Z4', '27')",
            new { shopId }, tx);

        tx.Commit();
    }

    private const string Schema = """
        IF OBJECT_ID('dbo.Shops') IS NULL
        CREATE TABLE dbo.Shops (
            Id INT IDENTITY PRIMARY KEY,
            Name NVARCHAR(150) NOT NULL,
            Gstin NVARCHAR(15) NULL,
            StateCode CHAR(2) NOT NULL,
            Address NVARCHAR(300) NULL,
            Phone NVARCHAR(15) NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        );
        GO
        IF OBJECT_ID('dbo.Users') IS NULL
        CREATE TABLE dbo.Users (
            Id INT IDENTITY PRIMARY KEY,
            ShopId INT NOT NULL REFERENCES dbo.Shops(Id),
            Email NVARCHAR(150) NOT NULL UNIQUE,
            PasswordHash NVARCHAR(200) NOT NULL,
            FullName NVARCHAR(100) NOT NULL,
            Role NVARCHAR(20) NOT NULL DEFAULT 'Owner'
        );
        GO
        IF OBJECT_ID('dbo.Products') IS NULL
        CREATE TABLE dbo.Products (
            Id INT IDENTITY PRIMARY KEY,
            ShopId INT NOT NULL REFERENCES dbo.Shops(Id),
            Name NVARCHAR(150) NOT NULL,
            HsnCode NVARCHAR(10) NULL,
            Unit NVARCHAR(10) NOT NULL DEFAULT 'pcs',
            Price DECIMAL(12,2) NOT NULL,
            GstRate DECIMAL(5,2) NOT NULL,
            StockQty DECIMAL(12,2) NOT NULL DEFAULT 0,
            LowStockLevel DECIMAL(12,2) NOT NULL DEFAULT 5,
            IsActive BIT NOT NULL DEFAULT 1
        );
        GO
        IF OBJECT_ID('dbo.Customers') IS NULL
        CREATE TABLE dbo.Customers (
            Id INT IDENTITY PRIMARY KEY,
            ShopId INT NOT NULL REFERENCES dbo.Shops(Id),
            Name NVARCHAR(150) NOT NULL,
            Phone NVARCHAR(15) NULL,
            Gstin NVARCHAR(15) NULL,
            StateCode CHAR(2) NOT NULL
        );
        GO
        IF OBJECT_ID('dbo.Invoices') IS NULL
        CREATE TABLE dbo.Invoices (
            Id INT IDENTITY PRIMARY KEY,
            ShopId INT NOT NULL REFERENCES dbo.Shops(Id),
            CustomerId INT NULL REFERENCES dbo.Customers(Id),
            InvoiceNo NVARCHAR(30) NOT NULL,
            InvoiceDate DATE NOT NULL,
            IsInterState BIT NOT NULL,
            SubTotal DECIMAL(12,2) NOT NULL,
            Cgst DECIMAL(12,2) NOT NULL,
            Sgst DECIMAL(12,2) NOT NULL,
            Igst DECIMAL(12,2) NOT NULL,
            GrandTotal DECIMAL(12,2) NOT NULL,
            CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
            CONSTRAINT UQ_Invoice_No UNIQUE (ShopId, InvoiceNo)
        );
        GO
        IF OBJECT_ID('dbo.InvoiceItems') IS NULL
        CREATE TABLE dbo.InvoiceItems (
            Id INT IDENTITY PRIMARY KEY,
            InvoiceId INT NOT NULL REFERENCES dbo.Invoices(Id),
            ProductId INT NOT NULL REFERENCES dbo.Products(Id),
            ProductName NVARCHAR(150) NOT NULL,
            HsnCode NVARCHAR(10) NULL,
            Qty DECIMAL(12,2) NOT NULL,
            Price DECIMAL(12,2) NOT NULL,
            GstRate DECIMAL(5,2) NOT NULL,
            TaxableAmount DECIMAL(12,2) NOT NULL,
            GstAmount DECIMAL(12,2) NOT NULL,
            LineTotal DECIMAL(12,2) NOT NULL
        );
        GO
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_Shop')
            CREATE INDEX IX_Products_Shop ON dbo.Products(ShopId);
        GO
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Invoices_Shop_Date')
            CREATE INDEX IX_Invoices_Shop_Date ON dbo.Invoices(ShopId, InvoiceDate);
        """;
}
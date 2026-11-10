using System.Data;
using System.Text;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using SmartBill.Api.Models;

namespace SmartBill.Api.Controllers;

[Route("api/auth")]
public class AuthController(IDbConnection db, IConfiguration config) : ApiControllerBase
{
    public record RegisterRequest(string ShopName, string StateCode, string? Gstin,
                                  string FullName, string Email, string Password);
    public record LoginRequest(string Email, string Password);

    private class UserRow
    {
        public int Id { get; set; }
        public int ShopId { get; set; }
        public string PasswordHash { get; set; } = "";
        public string FullName { get; set; } = "";
        public string ShopName { get; set; } = "";
        public string StateCode { get; set; } = "";
    }

    [AllowAnonymous, HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest r)
    {
        var email = r.Email.Trim();
        if (string.IsNullOrWhiteSpace(r.ShopName) || string.IsNullOrWhiteSpace(r.FullName))
            return BadRequest(new { error = "Shop name and your name are required." });
        if (r.StateCode.Length != 2 || !r.StateCode.All(char.IsDigit))
            return BadRequest(new { error = "Please choose a valid state." });
        if (!email.Contains('@'))
            return BadRequest(new { error = "Please enter a valid email address." });
        if (r.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        db.Open();
        using var tx = db.BeginTransaction();

        var exists = await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM Users WHERE Email = @email", new { email }, tx);
        if (exists > 0) return Conflict(new { error = "This email is already registered." });

        var shopName = r.ShopName.Trim();
        var fullName = r.FullName.Trim();
        var gstin = string.IsNullOrWhiteSpace(r.Gstin) ? null : r.Gstin.Trim().ToUpperInvariant();

        var shopId = await db.ExecuteScalarAsync<int>(@"
            INSERT INTO Shops (Name, StateCode, Gstin) OUTPUT INSERTED.Id
            VALUES (@shopName, @stateCode, @gstin)",
            new { shopName, stateCode = r.StateCode, gstin }, tx);

        var userId = await db.ExecuteScalarAsync<int>(@"
            INSERT INTO Users (ShopId, Email, PasswordHash, FullName) OUTPUT INSERTED.Id
            VALUES (@shopId, @email, @hash, @fullName)",
            new { shopId, email, hash = BCrypt.Net.BCrypt.HashPassword(r.Password), fullName }, tx);

        tx.Commit();
        return Ok(new AuthResponse(CreateToken(userId, shopId), fullName, shopName, r.StateCode));
    }

    [AllowAnonymous, HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest r)
    {
        var user = await db.QuerySingleOrDefaultAsync<UserRow>(@"
            SELECT u.Id, u.ShopId, u.PasswordHash, u.FullName, s.Name AS ShopName, s.StateCode
            FROM Users u JOIN Shops s ON s.Id = u.ShopId
            WHERE u.Email = @email", new { email = r.Email.Trim() });

        if (user is null || !BCrypt.Net.BCrypt.Verify(r.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });

        return Ok(new AuthResponse(CreateToken(user.Id, user.ShopId), user.FullName, user.ShopName, user.StateCode));
    }

    private string CreateToken(int userId, int shopId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Claims = new Dictionary<string, object>
            {
                ["userId"] = userId.ToString(),
                ["shopId"] = shopId.ToString()
            },
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        });
    }
}
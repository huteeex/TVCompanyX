using Lab12TVCompanyX.Models;
using Lab12TVCompanyX.Utils;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Lab12TVCompanyX.Controllers;
public class AccountController : Controller
{
    private readonly TvcompanyxContext _context;

    public AccountController(TvcompanyxContext context)
    {
        _context = context;
    }

    // GET /Account/Login
    [HttpGet]
    public IActionResult Login()
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToAction("Index", "Home");

        return View();
    }

    // POST /Account/Login
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);
        var passwordHash = PasswordHelper.ComputeSha256(model.Password);
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u =>
                u.Email == model.Email &&
                u.PasswordHash == passwordHash &&
                u.IsActive);

        if (user is null)
        {
            ModelState.AddModelError(string.Empty, "Неверный email или пароль");
            return View(model);
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name,      user.Email),
            new(ClaimTypes.GivenName, $"{user.LastName} {user.FirstName}"),
            new("UserId",             user.UserId.ToString()),
            new(ClaimTypes.Role,      user.Role?.Name ?? "customer")
        };

        var identity  = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = false,        
                AllowRefresh = true
            });

        return RedirectToAction("Index", "Home");
    }

    // POST /Account/Logout
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Login", "Account");
    }

    [HttpGet]
    public async Task<IActionResult> LogoutGet()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Login", "Account");
    }

    // GET /Account/Register
    [HttpGet]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
            return RedirectToAction("Index", "Home");
        return View();
    }

    // POST /Account/Register
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        // проверяем уникальность email
        var exists = await _context.Users
            .AnyAsync(u => u.Email == model.Email);

        if (exists)
        {
            ModelState.AddModelError(nameof(model.Email), "Пользователь с таким email уже зарегистрирован");
            return View(model);
        }

        var user = new User
        {
            FirstName    = model.FirstName,
            LastName     = model.LastName,
            MiddleName   = model.MiddleName,
            Email        = model.Email,
            PasswordHash = PasswordHelper.ComputeSha256(model.Password),
            RoleId       = 7, // customer
            Phone        = model.Phone,
            IsActive     = true,
            UpdatedAt    = DateTimeOffset.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // автоматический вход после регистрации
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name,      user.Email),
            new(ClaimTypes.GivenName, $"{user.LastName} {user.FirstName}"),
            new("UserId",             user.UserId.ToString()),
            new(ClaimTypes.Role,      "customer")
        };

        var identity  = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties { IsPersistent = false, AllowRefresh = true });

        return RedirectToAction("Index", "Home");
    }
}

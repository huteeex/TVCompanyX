using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize]
public class HomeController : Controller
{
    private readonly TvcompanyxContext _context;

    public HomeController(TvcompanyxContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var userIdStr = User.FindFirst("UserId")?.Value;
        if (!int.TryParse(userIdStr, out var userId))
            return RedirectToAction("Logout", "Account");

        var user = await _context.Users.Include(u => u.Role).AsNoTracking().FirstOrDefaultAsync(u => u.UserId == userId);
        ViewBag.User       = user;
        ViewBag.ShowCount  = await _context.TvShows.CountAsync(s => s.IsActive);
        ViewBag.AppCount   = await _context.Requests.CountAsync();
        ViewBag.UserCount  = await _context.Users.CountAsync(u => u.IsActive);
        ViewBag.ContractCount = await _context.Contracts.CountAsync();

        return View();
    }
}

using Lab12TVCompanyX.Models;
using Lab12TVCompanyX.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize(Roles = "admin,director")]
public class UsersController : Controller
{
    private readonly TvcompanyxContext _context;

    public UsersController(TvcompanyxContext context)
    {
        _context = context;
    }

    // GET /Users
    public async Task<IActionResult> Index()
    {
        var users = await _context.Users
            .Include(u => u.Role)
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
            .AsNoTracking()
            .ToListAsync();
        return View(users);
    }

    // GET /Users/Details/{id}
    public async Task<IActionResult> Details(int id)
    {
        var user = await _context.Users
            .Include(u => u.CustomerRequests).ThenInclude(r => r.Schedule).ThenInclude(s => s.TvShow)
            .Include(u => u.AgentRequests).ThenInclude(r => r.Schedule).ThenInclude(s => s.TvShow)
            .Include(u => u.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == id);
        if (user is null) return NotFound();
        return View(user);
    }

    // GET /Users/Create
    public IActionResult Create()
    {
        ViewBag.Roles = RoleSelectList();
        return View();
    }

    // POST /Users/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(User user, string? plainPassword)
    {
        ModelState.Remove(nameof(user.PasswordHash));
        ModelState.Remove(nameof(user.CustomerRequests));
        ModelState.Remove(nameof(user.AgentRequests));
        if (!ModelState.IsValid)
        {
            ViewBag.Roles = RoleSelectList(user.RoleId);
            return View(user);
        }
        user.PasswordHash = string.IsNullOrWhiteSpace(plainPassword)
            ? null
            : PasswordHelper.ComputeSha256(plainPassword);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // GET /Users/Edit/{id}
    public async Task<IActionResult> Edit(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return NotFound();
        ViewBag.Roles = RoleSelectList(user.RoleId);
        return View(user);
    }

    // POST /Users/Edit/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, User user, string? plainPassword)
    {
        if (id != user.UserId) return BadRequest();
        ModelState.Remove(nameof(user.PasswordHash));
        ModelState.Remove(nameof(user.CustomerRequests));
        ModelState.Remove(nameof(user.AgentRequests));
        if (!ModelState.IsValid)
        {
            ViewBag.Roles = RoleSelectList(user.RoleId);
            return View(user);
        }
        if (!string.IsNullOrWhiteSpace(plainPassword))
            user.PasswordHash = PasswordHelper.ComputeSha256(plainPassword);
        else
        {
            var existing = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == id);
            user.PasswordHash = existing?.PasswordHash;
        }
        _context.Entry(user).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // GET /Users/Delete/{id}
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == id);
        if (user is null) return NotFound();
        return View(user);
    }

    // POST /Users/Delete/{id}
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is not null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    private static SelectList RoleSelectList(int? selectedId = null)
    {
        var items = new List<SelectListItem>
        {
            new("Заказчик",      "7"),
            new("Агент",         "4"),
            new("Коммерческий",  "5"),
            new("Бухгалтер",     "6"),
            new("Администратор", "1"),
            new("Директор",      "2"),
        };
        return new SelectList(items, "Value", "Text", selectedId?.ToString() ?? "7");
    }
}

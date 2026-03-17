using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize(Roles = "admin,director")]
public class AuditLogsController : Controller
{
    private readonly TvcompanyxContext _context;
    public AuditLogsController(TvcompanyxContext context) => _context = context;

    // Audit log is read-only (only Index and Details)
    public async Task<IActionResult> Index()
    {
        var items = await _context.AuditLogs
            .Include(a => a.PerformedBy)
            .OrderByDescending(a => a.PerformedAt)
            .AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.AuditLogs
            .Include(a => a.PerformedBy)
            .AsNoTracking().FirstOrDefaultAsync(a => a.AuditId == id);
        if (item is null) return NotFound();
        return View(item);
    }
}

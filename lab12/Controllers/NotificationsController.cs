using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize]
public class NotificationsController : Controller
{
    private readonly TvcompanyxContext _context;
    public NotificationsController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.Notifications
            .Include(n => n.NotificationType)
            .Include(n => n.User)
            .OrderByDescending(n => n.CreatedAt)
            .AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.Notifications
            .Include(n => n.NotificationType)
            .Include(n => n.User)
            .AsNoTracking().FirstOrDefaultAsync(n => n.NotificationId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateDropdowns();
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Notification item)
    {
        ModelState.Remove(nameof(item.NotificationType));
        ModelState.Remove(nameof(item.User));
        if (!ModelState.IsValid) { await PopulateDropdowns(item); return View(item); }
        item.CreatedAt = DateTimeOffset.UtcNow;
        _context.Notifications.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.Notifications.FindAsync(id);
        if (item is null) return NotFound();
        await PopulateDropdowns(item);
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Notification item)
    {
        if (id != item.NotificationId) return BadRequest();
        ModelState.Remove(nameof(item.NotificationType));
        ModelState.Remove(nameof(item.User));
        if (!ModelState.IsValid) { await PopulateDropdowns(item); return View(item); }
        _context.Entry(item).State = EntityState.Modified;
        _context.Entry(item).Property(n => n.CreatedAt).IsModified = false;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.Notifications
            .Include(n => n.NotificationType).Include(n => n.User)
            .AsNoTracking().FirstOrDefaultAsync(n => n.NotificationId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.Notifications.FindAsync(id);
        if (item is not null) { _context.Notifications.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateDropdowns(Notification? selected = null)
    {
        var types = await _context.NotificationTypes.OrderBy(t => t.Name).AsNoTracking().ToListAsync();
        var users = await _context.Users.Where(u => u.IsActive).OrderBy(u => u.LastName).AsNoTracking().ToListAsync();
        ViewBag.NotificationTypeId = new SelectList(types, nameof(NotificationType.NotificationTypeId), nameof(NotificationType.Name), selected?.NotificationTypeId);
        ViewBag.UserId = new SelectList(
            users.Select(u => new { u.UserId, Name = $"{u.LastName} {u.FirstName}" }),
            "UserId", "Name", selected?.UserId);
    }
}

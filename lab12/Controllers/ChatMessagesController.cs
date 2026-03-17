using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize]
public class ChatMessagesController : Controller
{
    private readonly TvcompanyxContext _context;
    public ChatMessagesController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.ChatMessages
            .Include(m => m.Request)
            .Include(m => m.Sender)
            .OrderByDescending(m => m.CreatedAt)
            .AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.ChatMessages
            .Include(m => m.Request).ThenInclude(r => r.Customer)
            .Include(m => m.Sender)
            .AsNoTracking().FirstOrDefaultAsync(m => m.MessageId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateDropdowns();
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ChatMessage item)
    {
        ModelState.Remove(nameof(item.Request));
        ModelState.Remove(nameof(item.Sender));
        if (!ModelState.IsValid) { await PopulateDropdowns(item); return View(item); }
        item.CreatedAt = DateTimeOffset.UtcNow;
        _context.ChatMessages.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.ChatMessages.FindAsync(id);
        if (item is null) return NotFound();
        await PopulateDropdowns(item);
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, ChatMessage item)
    {
        if (id != item.MessageId) return BadRequest();
        ModelState.Remove(nameof(item.Request));
        ModelState.Remove(nameof(item.Sender));
        if (!ModelState.IsValid) { await PopulateDropdowns(item); return View(item); }
        _context.Entry(item).State = EntityState.Modified;
        _context.Entry(item).Property(m => m.CreatedAt).IsModified = false;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.ChatMessages
            .Include(m => m.Request).Include(m => m.Sender)
            .AsNoTracking().FirstOrDefaultAsync(m => m.MessageId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.ChatMessages.FindAsync(id);
        if (item is not null) { _context.ChatMessages.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateDropdowns(ChatMessage? selected = null)
    {
        var requests = await _context.Requests.Include(r => r.Customer)
            .OrderByDescending(r => r.CreatedAt).AsNoTracking().ToListAsync();
        var users = await _context.Users.Where(u => u.IsActive).OrderBy(u => u.LastName).AsNoTracking().ToListAsync();
        ViewBag.RequestId = new SelectList(
            requests.Select(r => new { r.RequestId, Name = $"#{r.RequestId} — {r.Customer!.LastName} {r.Customer.FirstName}" }),
            "RequestId", "Name", selected?.RequestId);
        ViewBag.SenderId = new SelectList(
            users.Select(u => new { u.UserId, Name = $"{u.LastName} {u.FirstName}" }),
            "UserId", "Name", selected?.SenderId);
    }
}

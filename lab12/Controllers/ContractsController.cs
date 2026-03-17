using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize(Roles = "admin,director,commercial,accountant,agent")]
public class ContractsController : Controller
{
    private readonly TvcompanyxContext _context;
    public ContractsController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.Contracts
            .Include(c => c.Request).ThenInclude(r => r.Customer)
            .OrderByDescending(c => c.ContractDate)
            .AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.Contracts
            .Include(c => c.Request).ThenInclude(r => r.Customer)
            .Include(c => c.Request).ThenInclude(r => r.Agent)
            .Include(c => c.Request).ThenInclude(r => r.Schedule).ThenInclude(s => s.TvShow)
            .AsNoTracking().FirstOrDefaultAsync(c => c.RequestId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateRequests();
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Contract item)
    {
        ModelState.Remove(nameof(item.Request));
        if (!ModelState.IsValid) { await PopulateRequests(item.RequestId); return View(item); }
        item.CreatedAt = DateTimeOffset.UtcNow;
        _context.Contracts.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.Contracts.FindAsync(id);
        if (item is null) return NotFound();
        await PopulateRequests(item.RequestId);
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Contract item)
    {
        if (id != item.RequestId) return BadRequest();
        ModelState.Remove(nameof(item.Request));
        if (!ModelState.IsValid) { await PopulateRequests(item.RequestId); return View(item); }
        _context.Entry(item).State = EntityState.Modified;
        _context.Entry(item).Property(c => c.CreatedAt).IsModified = false;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.Contracts.Include(c => c.Request).ThenInclude(r => r.Customer)
            .AsNoTracking().FirstOrDefaultAsync(c => c.RequestId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.Contracts.FindAsync(id);
        if (item is not null) { _context.Contracts.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateRequests(int? selectedId = null)
    {
        var requests = await _context.Requests
            .Include(r => r.Customer)
            .Where(r => !_context.Contracts.Any(c => c.RequestId == r.RequestId) || r.RequestId == selectedId)
            .OrderByDescending(r => r.CreatedAt).AsNoTracking().ToListAsync();
        ViewBag.RequestId = new SelectList(
            requests.Select(r => new { r.RequestId, Name = $"#{r.RequestId} — {r.Customer!.LastName} {r.Customer.FirstName}" }),
            "RequestId", "Name", selectedId);
    }
}

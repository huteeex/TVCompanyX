using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize(Roles = "admin,director")]
public class RequestStatusTypesController : Controller
{
    private readonly TvcompanyxContext _context;
    public RequestStatusTypesController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.RequestStatusTypes.OrderBy(s => s.StatusId).AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.RequestStatusTypes.AsNoTracking().FirstOrDefaultAsync(s => s.StatusId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public IActionResult Create() => View();

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(RequestStatusType item)
    {
        ModelState.Remove(nameof(item.Requests));
        if (!ModelState.IsValid) return View(item);
        _context.RequestStatusTypes.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.RequestStatusTypes.FindAsync(id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, RequestStatusType item)
    {
        if (id != item.StatusId) return BadRequest();
        ModelState.Remove(nameof(item.Requests));
        if (!ModelState.IsValid) return View(item);
        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.RequestStatusTypes.AsNoTracking().FirstOrDefaultAsync(s => s.StatusId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.RequestStatusTypes.FindAsync(id);
        if (item is not null) { _context.RequestStatusTypes.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }
}

using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize(Roles = "admin,director")]
public class ShowTypesController : Controller
{
    private readonly TvcompanyxContext _context;
    public ShowTypesController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.ShowTypes.OrderBy(t => t.Name).AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.ShowTypes.Include(t => t.TvShows)
            .AsNoTracking().FirstOrDefaultAsync(t => t.ShowTypeId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public IActionResult Create() => View();

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ShowType item)
    {
        ModelState.Remove(nameof(item.TvShows));
        if (!ModelState.IsValid) return View(item);
        _context.ShowTypes.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.ShowTypes.FindAsync(id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, ShowType item)
    {
        if (id != item.ShowTypeId) return BadRequest();
        ModelState.Remove(nameof(item.TvShows));
        if (!ModelState.IsValid) return View(item);
        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.ShowTypes.AsNoTracking().FirstOrDefaultAsync(t => t.ShowTypeId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.ShowTypes.FindAsync(id);
        if (item is not null) { _context.ShowTypes.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }
}

using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize]
public class TvShowsController : Controller
{
    private readonly TvcompanyxContext _context;

    public TvShowsController(TvcompanyxContext context)
    {
        _context = context;
    }

    // GET /TvShows
    public async Task<IActionResult> Index()
    {
        var shows = await _context.TvShows
            .Include(s => s.ShowType)
            .OrderBy(s => s.Title)
            .AsNoTracking()
            .ToListAsync();
        return View(shows);
    }

    // GET /TvShows/Details/{id}
    public async Task<IActionResult> Details(int id)
    {
        var show = await _context.TvShows
            .Include(s => s.ShowType)
            .Include(s => s.Schedules)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TvShowId == id);

        if (show is null) return NotFound();
        return View(show);
    }

    // GET /TvShows/Create
    public async Task<IActionResult> Create()
    {
        await PopulateShowTypes();
        return View();
    }

    // POST /TvShows/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(TvShow show)
    {
        ModelState.Remove(nameof(show.ShowType));
        ModelState.Remove(nameof(show.Schedules));
        if (!ModelState.IsValid)
        {
            await PopulateShowTypes(show.ShowTypeId);
            return View(show);
        }
        show.UpdatedAt = DateTimeOffset.UtcNow;
        _context.TvShows.Add(show);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // GET /TvShows/Edit/{id}
    public async Task<IActionResult> Edit(int id)
    {
        var show = await _context.TvShows.FindAsync(id);
        if (show is null) return NotFound();
        await PopulateShowTypes(show.ShowTypeId);
        return View(show);
    }

    // POST /TvShows/Edit/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, TvShow show)
    {
        if (id != show.TvShowId) return BadRequest();
        ModelState.Remove(nameof(show.ShowType));
        ModelState.Remove(nameof(show.Schedules));
        if (!ModelState.IsValid)
        {
            await PopulateShowTypes(show.ShowTypeId);
            return View(show);
        }
        show.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Entry(show).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // GET /TvShows/Delete/{id}
    public async Task<IActionResult> Delete(int id)
    {
        var show = await _context.TvShows
            .Include(s => s.ShowType)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TvShowId == id);
        if (show is null) return NotFound();
        return View(show);
    }

    // POST /TvShows/Delete/{id}
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var show = await _context.TvShows.FindAsync(id);
        if (show is not null)
        {
            _context.TvShows.Remove(show);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateShowTypes(int? selectedId = null)
    {
        var types = await _context.ShowTypes.OrderBy(t => t.Name).AsNoTracking().ToListAsync();
        ViewBag.ShowTypeId = new SelectList(types, nameof(ShowType.ShowTypeId), nameof(ShowType.Name), selectedId);
    }
}

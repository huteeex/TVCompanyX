using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize]
public class ShowSchedulesController : Controller
{
    private readonly TvcompanyxContext _context;
    public ShowSchedulesController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.ShowSchedules
            .Include(s => s.TvShow)
            .OrderByDescending(s => s.AirDate).ThenBy(s => s.AirTime)
            .AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.ShowSchedules
            .Include(s => s.TvShow)
            .Include(s => s.Requests).ThenInclude(r => r.Customer)
            .AsNoTracking().FirstOrDefaultAsync(s => s.ScheduleId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public async Task<IActionResult> Create()
    {
        await PopulateShows();
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ShowSchedule item)
    {
        ModelState.Remove(nameof(item.TvShow));
        ModelState.Remove(nameof(item.Requests));
        if (!ModelState.IsValid) { await PopulateShows(item.TvShowId); return View(item); }
        item.UpdatedAt = DateTimeOffset.UtcNow;
        _context.ShowSchedules.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.ShowSchedules.FindAsync(id);
        if (item is null) return NotFound();
        await PopulateShows(item.TvShowId);
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, ShowSchedule item)
    {
        if (id != item.ScheduleId) return BadRequest();
        ModelState.Remove(nameof(item.TvShow));
        ModelState.Remove(nameof(item.Requests));
        if (!ModelState.IsValid) { await PopulateShows(item.TvShowId); return View(item); }
        item.UpdatedAt = DateTimeOffset.UtcNow;
        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.ShowSchedules.Include(s => s.TvShow)
            .AsNoTracking().FirstOrDefaultAsync(s => s.ScheduleId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.ShowSchedules.FindAsync(id);
        if (item is not null) { _context.ShowSchedules.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateShows(int? selectedId = null)
    {
        var shows = await _context.TvShows.Where(s => s.IsActive).OrderBy(s => s.Title).AsNoTracking().ToListAsync();
        ViewBag.TvShowId = new SelectList(shows, nameof(TvShow.TvShowId), nameof(TvShow.Title), selectedId);
    }
}

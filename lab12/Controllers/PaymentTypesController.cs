using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize(Roles = "admin,director")]
public class PaymentTypesController : Controller
{
    private readonly TvcompanyxContext _context;
    public PaymentTypesController(TvcompanyxContext context) => _context = context;

    public async Task<IActionResult> Index()
    {
        var items = await _context.PaymentTypes.OrderBy(p => p.Name).AsNoTracking().ToListAsync();
        return View(items);
    }

    public async Task<IActionResult> Details(int id)
    {
        var item = await _context.PaymentTypes.AsNoTracking().FirstOrDefaultAsync(p => p.PaymentTypeId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    public IActionResult Create() => View();

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(PaymentType item)
    {
        ModelState.Remove(nameof(item.Requests));
        if (!ModelState.IsValid) return View(item);
        _context.PaymentTypes.Add(item);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var item = await _context.PaymentTypes.FindAsync(id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, PaymentType item)
    {
        if (id != item.PaymentTypeId) return BadRequest();
        ModelState.Remove(nameof(item.Requests));
        if (!ModelState.IsValid) return View(item);
        _context.Entry(item).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.PaymentTypes.AsNoTracking().FirstOrDefaultAsync(p => p.PaymentTypeId == id);
        if (item is null) return NotFound();
        return View(item);
    }

    [HttpPost, ActionName("Delete"), ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var item = await _context.PaymentTypes.FindAsync(id);
        if (item is not null) { _context.PaymentTypes.Remove(item); await _context.SaveChangesAsync(); }
        return RedirectToAction(nameof(Index));
    }
}

using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Controllers;

[Authorize]
public class RequestsController : Controller
{
    private readonly TvcompanyxContext _context;

    // Status IDs from request_status_type table
    private const int StatusNew        = 1; // Новая
    private const int StatusInProgress = 2; // В обсуждении
    private const int StatusApproved   = 3; // Одобрена
    private const int StatusPaid       = 4; // Оплачена
    private const int StatusCancelled  = 5; // Отменена

    public RequestsController(TvcompanyxContext context)
    {
        _context = context;
    }

    private int CurrentUserId =>
        int.TryParse(User.FindFirst("UserId")?.Value, out var id) ? id : 0;

    private string CurrentRole =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";

    // GET /Requests
    public async Task<IActionResult> Index()
    {
        var role = CurrentRole;
        var userId = CurrentUserId;

        IQueryable<Request> query = _context.Requests
            .Include(r => r.Customer)
            .Include(r => r.Agent)
            .Include(r => r.Schedule).ThenInclude(s => s.TvShow)
            .Include(r => r.Status);

        // Role-based filtering
        if (role == "customer")
            query = query.Where(r => r.CustomerId == userId);
        else if (role == "agent")
            query = query.Where(r => r.AgentId == userId || (r.AgentId == null && r.StatusId == StatusNew));

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        ViewBag.CurrentRole = role;
        ViewBag.CurrentUserId = userId;
        return View(requests);
    }

    // GET /Requests/Details/{id}
    public async Task<IActionResult> Details(int id)
    {
        var request = await _context.Requests
            .Include(r => r.Customer)
            .Include(r => r.Agent)
            .Include(r => r.Schedule).ThenInclude(s => s.TvShow)
            .Include(r => r.Status)
            .Include(r => r.PaymentType)
            .Include(r => r.Contract)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RequestId == id);
        if (request is null) return NotFound();

        ViewBag.CurrentRole = CurrentRole;
        ViewBag.CurrentUserId = CurrentUserId;
        return View(request);
    }

    // GET /Requests/Create
    public async Task<IActionResult> Create()
    {
        await PopulateDropdowns();
        return View();
    }

    // POST /Requests/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Request request)
    {
        var role = CurrentRole;

        // Customer creates for themselves; status always starts as "Новая"
        if (role == "customer")
            request.CustomerId = CurrentUserId;

        request.StatusId = StatusNew;
        request.AgentId = null;

        ModelState.Remove(nameof(request.Customer));
        ModelState.Remove(nameof(request.Agent));
        ModelState.Remove(nameof(request.Schedule));
        ModelState.Remove(nameof(request.Status));
        ModelState.Remove(nameof(request.PaymentType));
        ModelState.Remove(nameof(request.Contract));
        ModelState.Remove(nameof(request.ChatMessages));
        ModelState.Remove(nameof(request.StatusId));
        ModelState.Remove(nameof(request.AgentId));
        if (role == "customer")
            ModelState.Remove(nameof(request.CustomerId));

        if (!ModelState.IsValid)
        {
            await PopulateDropdowns(request);
            return View(request);
        }
        request.CreatedAt = DateTimeOffset.UtcNow;
        _context.Requests.Add(request);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // POST /Requests/TakeInWork/{id} — Agent takes a request from pool
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "agent")]
    public async Task<IActionResult> TakeInWork(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request is null) return NotFound();
        if (request.AgentId != null || request.StatusId != StatusNew)
            return BadRequest("Заявка уже взята в работу.");

        request.AgentId = CurrentUserId;
        request.StatusId = StatusInProgress;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }

    // POST /Requests/Approve/{id} — commercial/director/admin approves
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "commercial,director,admin")]
    public async Task<IActionResult> Approve(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request is null) return NotFound();
        if (request.StatusId != StatusInProgress)
            return BadRequest("Заявку нельзя одобрить в текущем статусе.");

        request.StatusId = StatusApproved;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }

    // POST /Requests/Reject/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "commercial,director,admin,agent")]
    public async Task<IActionResult> Reject(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request is null) return NotFound();
        if (request.StatusId >= StatusApproved)
            return BadRequest("Нельзя отменить одобренную/оплаченную заявку.");

        request.StatusId = StatusCancelled;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }

    // POST /Requests/MarkPaid/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "accountant,admin,director")]
    public async Task<IActionResult> MarkPaid(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request is null) return NotFound();
        if (request.StatusId != StatusApproved)
            return BadRequest("Оплатить можно только одобренную заявку.");

        request.StatusId = StatusPaid;
        request.PaymentDate = DateOnly.FromDateTime(DateTime.Today);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id });
    }

    // GET /Requests/Edit/{id}
    [Authorize(Roles = "admin,director,agent")]
    public async Task<IActionResult> Edit(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request is null) return NotFound();
        await PopulateDropdowns(request);
        return View(request);
    }

    // POST /Requests/Edit/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "admin,director,agent")]
    public async Task<IActionResult> Edit(int id, Request request)
    {
        if (id != request.RequestId) return BadRequest();
        ModelState.Remove(nameof(request.Customer));
        ModelState.Remove(nameof(request.Agent));
        ModelState.Remove(nameof(request.Schedule));
        ModelState.Remove(nameof(request.Status));
        ModelState.Remove(nameof(request.PaymentType));
        ModelState.Remove(nameof(request.Contract));
        ModelState.Remove(nameof(request.ChatMessages));
        if (!ModelState.IsValid)
        {
            await PopulateDropdowns(request);
            return View(request);
        }
        _context.Entry(request).State = EntityState.Modified;
        _context.Entry(request).Property(r => r.CreatedAt).IsModified = false;
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // GET /Requests/Delete/{id}
    [Authorize(Roles = "admin,director")]
    public async Task<IActionResult> Delete(int id)
    {
        var request = await _context.Requests
            .Include(r => r.Customer)
            .Include(r => r.Schedule).ThenInclude(s => s.TvShow)
            .Include(r => r.Status)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RequestId == id);
        if (request is null) return NotFound();
        return View(request);
    }

    // POST /Requests/Delete/{id}
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "admin,director")]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request is not null)
        {
            _context.Requests.Remove(request);
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Index));
    }

    private async Task PopulateDropdowns(Request? selected = null)
    {
        var role = CurrentRole;

        var schedules = await _context.ShowSchedules
            .Include(s => s.TvShow)
            .OrderBy(s => s.AirDate).AsNoTracking().ToListAsync();
        var payTypes = await _context.PaymentTypes
            .OrderBy(p => p.Name).AsNoTracking().ToListAsync();

        ViewBag.ScheduleId = new SelectList(
            schedules.Select(s => new { s.ScheduleId, Name = $"{s.TvShow!.Title} — {s.AirDate:dd.MM.yyyy} {s.AirTime:HH\\:mm}" }),
            "ScheduleId", "Name", selected?.ScheduleId);
        ViewBag.PaymentTypeId = new SelectList(payTypes, nameof(PaymentType.PaymentTypeId), nameof(PaymentType.Name), selected?.PaymentTypeId);

        // Only admin/director can pick customer; agents don't need agent dropdown
        if (role == "admin" || role == "director")
        {
            var customers = await _context.Users
                .Where(u => u.IsActive && u.Role!.Name == "customer")
                .OrderBy(u => u.LastName).AsNoTracking().ToListAsync();
            ViewBag.CustomerId = new SelectList(
                customers.Select(u => new { u.UserId, Name = $"{u.LastName} {u.FirstName}" }),
                "UserId", "Name", selected?.CustomerId);

            var statuses = await _context.RequestStatusTypes
                .OrderBy(s => s.StatusId).AsNoTracking().ToListAsync();
            ViewBag.StatusId = new SelectList(statuses, nameof(RequestStatusType.StatusId), nameof(RequestStatusType.Name), selected?.StatusId);
        }

        ViewBag.CurrentRole = role;
    }
}

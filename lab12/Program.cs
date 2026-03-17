using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllersWithViews();

        // PostgreSQL + EF Core (без ENUM-типов — справочники в отдельных таблицах)
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Строка подключения 'DefaultConnection' не найдена.");

        builder.Services.AddDbContext<TvcompanyxContext>(options =>
            options.UseNpgsql(connectionString));

        // ── Cookie аутентификация ──────────────────────────────────────────
        // Microsoft.AspNetCore.Authentication.Cookies входит в состав SDK,
        // отдельного пакета не требуется.
        builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.LoginPath        = "/Account/Login";
                options.AccessDeniedPath = "/Account/Login";
                options.ExpireTimeSpan   = TimeSpan.FromHours(8);
                options.SlidingExpiration = true;
            });

        // ────────────────────────────────────────────────────────────────────
        var app = builder.Build();

        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
        }

        app.UseHttpsRedirection();
        app.UseStaticFiles();

        app.UseRouting();

        // ВАЖНО: UseAuthentication ДО UseAuthorization
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");

        // Всех неавторизованных пользователей — на страницу входа
        app.MapControllerRoute(
            name: "catchall",
            pattern: "{*url}",
            defaults: new { controller = "Account", action = "Login" });

        app.Run();
    }
}

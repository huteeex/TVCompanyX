using Lab12TVCompanyX.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
        });

        builder.Services.AddControllersWithViews();

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Строка подключения 'DefaultConnection' не найдена.");

        builder.Services.AddDbContext<TvcompanyxContext>(options =>
            options.UseNpgsql(connectionString));

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

        app.UseForwardedHeaders();

        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
        }

        // UseHttpsRedirection is intentionally omitted — the app is served over
        // plain HTTP behind a reverse proxy. Enabling it would cause POST to
        // /Account/Login to return 307/308, losing the request body and making
        // antiforgery validation fail with HTTP 500.
        app.UseStaticFiles();

        app.UseRouting();

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");

        app.MapControllerRoute(
            name: "catchall",
            pattern: "{*url}",
            defaults: new { controller = "Account", action = "Login" });

        app.Run();
    }
}

using Microsoft.EntityFrameworkCore;

namespace Lab12TVCompanyX.Models;

public class TvcompanyxContext : DbContext
{
    public TvcompanyxContext(DbContextOptions<TvcompanyxContext> options) : base(options) { }

    public DbSet<User>              Users               { get; set; }
    public DbSet<Role>              Roles               { get; set; }
    public DbSet<ShowType>          ShowTypes           { get; set; }
    public DbSet<TvShow>            TvShows             { get; set; }
    public DbSet<ShowSchedule>      ShowSchedules       { get; set; }
    public DbSet<RequestStatusType> RequestStatusTypes  { get; set; }
    public DbSet<PaymentType>       PaymentTypes        { get; set; }
    public DbSet<Request>           Requests            { get; set; }
    public DbSet<Contract>          Contracts           { get; set; }
    public DbSet<NotificationType>  NotificationTypes   { get; set; }
    public DbSet<Notification>      Notifications       { get; set; }
    public DbSet<ChatMessage>       ChatMessages        { get; set; }
    public DbSet<AuditLog>          AuditLogs           { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // role
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("role");
            entity.HasKey(e => e.RoleId);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // users
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.UserId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasOne(e => e.Role)
                  .WithMany(r => r.Users)
                  .HasForeignKey(e => e.RoleId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // show_type
        modelBuilder.Entity<ShowType>(entity =>
        {
            entity.ToTable("show_type");
            entity.HasKey(e => e.ShowTypeId);
        });

        // tv_show
        modelBuilder.Entity<TvShow>(entity =>
        {
            entity.ToTable("tv_show");
            entity.HasKey(e => e.TvShowId);
            entity.HasOne(e => e.ShowType)
                  .WithMany(t => t.TvShows)
                  .HasForeignKey(e => e.ShowTypeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // show_schedule
        modelBuilder.Entity<ShowSchedule>(entity =>
        {
            entity.ToTable("show_schedule");
            entity.HasKey(e => e.ScheduleId);
            entity.HasOne(e => e.TvShow)
                  .WithMany(s => s.Schedules)
                  .HasForeignKey(e => e.TvShowId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // request_status_type
        modelBuilder.Entity<RequestStatusType>(entity =>
        {
            entity.ToTable("request_status_type");
            entity.HasKey(e => e.StatusId);
        });

        // payment_type
        modelBuilder.Entity<PaymentType>(entity =>
        {
            entity.ToTable("payment_type");
            entity.HasKey(e => e.PaymentTypeId);
        });

        // request
        modelBuilder.Entity<Request>(entity =>
        {
            entity.ToTable("request");
            entity.HasKey(e => e.RequestId);
            entity.HasOne(e => e.Customer)
                  .WithMany(u => u.CustomerRequests)
                  .HasForeignKey(e => e.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Agent)
                  .WithMany(u => u.AgentRequests)
                  .HasForeignKey(e => e.AgentId)
                  .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Schedule)
                  .WithMany(s => s.Requests)
                  .HasForeignKey(e => e.ScheduleId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Status)
                  .WithMany(s => s.Requests)
                  .HasForeignKey(e => e.StatusId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PaymentType)
                  .WithMany(p => p.Requests)
                  .HasForeignKey(e => e.PaymentTypeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // contract — PK is also FK to request (1:1)
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.ToTable("contract");
            entity.HasKey(e => e.RequestId);
            entity.HasOne(e => e.Request)
                  .WithOne(r => r.Contract)
                  .HasForeignKey<Contract>(e => e.RequestId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // notification_type
        modelBuilder.Entity<NotificationType>(entity =>
        {
            entity.ToTable("notification_type");
            entity.HasKey(e => e.NotificationTypeId);
        });

        // notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notification");
            entity.HasKey(e => e.NotificationId);
            entity.HasOne(e => e.NotificationType)
                  .WithMany(t => t.Notifications)
                  .HasForeignKey(e => e.NotificationTypeId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Notifications)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // chat_message
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("chat_message");
            entity.HasKey(e => e.MessageId);
            entity.HasOne(e => e.Request)
                  .WithMany(r => r.ChatMessages)
                  .HasForeignKey(e => e.RequestId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Sender)
                  .WithMany(u => u.SentMessages)
                  .HasForeignKey(e => e.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // audit_log
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_log");
            entity.HasKey(e => e.AuditId);
            entity.HasOne(e => e.PerformedBy)
                  .WithMany()
                  .HasForeignKey(e => e.PerformedById)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

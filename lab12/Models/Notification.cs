using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("notification")]
public class Notification
{
    [Column("notification_id")]
    public int NotificationId { get; set; }

    [Column("notification_type_id")]
    public int NotificationTypeId { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("message")]
    public string Message { get; set; } = null!;

    [Column("is_read")]
    public bool IsRead { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation
    public NotificationType NotificationType { get; set; } = null!;
    public User User { get; set; } = null!;
}

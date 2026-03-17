using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("notification_type")]
public class NotificationType
{
    [Column("notification_type_id")]
    public int NotificationTypeId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    // Navigation
    public ICollection<Notification> Notifications { get; set; } = [];
}

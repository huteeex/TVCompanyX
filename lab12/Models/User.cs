using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("users")]
public class User
{
    [Column("user_id")]
    public int UserId { get; set; }

    [Column("first_name")]
    public string FirstName { get; set; } = null!;

    [Column("last_name")]
    public string LastName { get; set; } = null!;

    [Column("middle_name")]
    public string? MiddleName { get; set; }

    [Column("email")]
    public string Email { get; set; } = null!;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = null!;

    [Column("role_id")]
    public int RoleId { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    public Role? Role { get; set; }

    public ICollection<Request> CustomerRequests { get; set; } = [];
    public ICollection<Request> AgentRequests    { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<ChatMessage> SentMessages  { get; set; } = [];
}

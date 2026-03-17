using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Lab12TVCompanyX.Models;

[Table("audit_log")]
public class AuditLog
{
    [Column("audit_id")]
    public int AuditId { get; set; }

    [Column("entity_name")]
    public string EntityName { get; set; } = null!;

    [Column("entity_id")]
    public int EntityId { get; set; }

    [Column("action")]
    public string Action { get; set; } = null!;

    [Column("performed_by_id")]
    public int? PerformedById { get; set; }

    [Column("performed_at")]
    public DateTimeOffset PerformedAt { get; set; }

    [Column("data", TypeName = "jsonb")]
    public JsonDocument? Data { get; set; }

    // Navigation
    public User? PerformedBy { get; set; }
}

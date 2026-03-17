using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("request")]
public class Request
{
    [Column("request_id")]
    public int RequestId { get; set; }

    [Column("customer_id")]
    public int CustomerId { get; set; }

    [Column("agent_id")]
    public int? AgentId { get; set; }

    [Column("schedule_id")]
    public int ScheduleId { get; set; }

    [Column("planned_datetime")]
    public DateTimeOffset? PlannedDatetime { get; set; }

    [Column("duration_seconds")]
    public int DurationSeconds { get; set; }

    [Column("status_id")]
    public int StatusId { get; set; }

    [Column("total_cost")]
    public decimal TotalCost { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("contact_phone")]
    public string ContactPhone { get; set; } = null!;

    [Column("payment_type_id")]
    public int? PaymentTypeId { get; set; }

    [Column("payment_date")]
    public DateOnly? PaymentDate { get; set; }

    [Column("payment_due_date")]
    public DateOnly? PaymentDueDate { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation
    public User Customer { get; set; } = null!;
    public User? Agent { get; set; }
    public ShowSchedule Schedule { get; set; } = null!;
    public RequestStatusType Status { get; set; } = null!;
    public PaymentType? PaymentType { get; set; }
    public Contract? Contract { get; set; }
    public ICollection<ChatMessage> ChatMessages { get; set; } = [];
}

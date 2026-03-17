using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("contract")]
public class Contract
{
    [Column("request_id")]
    public int RequestId { get; set; }

    [Column("contract_number")]
    public string ContractNumber { get; set; } = null!;

    [Column("contract_date")]
    public DateOnly ContractDate { get; set; }

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("agent_commission")]
    public decimal? AgentCommission { get; set; }

    // Navigation
    public Request Request { get; set; } = null!;
}

using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("payment_type")]
public class PaymentType
{
    [Column("payment_type_id")]
    public int PaymentTypeId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    // Navigation
    public ICollection<Request> Requests { get; set; } = [];
}

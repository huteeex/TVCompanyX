using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("request_status_type")]
public class RequestStatusType
{
    [Column("status_id")]
    public int StatusId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    // Navigation
    public ICollection<Request> Requests { get; set; } = [];
}

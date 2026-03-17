using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("tv_show")]
public class TvShow
{
    [Column("tv_show_id")]
    public int TvShowId { get; set; }

    [Column("title")]
    public string Title { get; set; } = null!;

    [Column("advertising_minutes")]
    public decimal AdvertisingMinutes { get; set; }

    [Column("price_per_minute")]
    public decimal PricePerMinute { get; set; }

    [Column("show_type_id")]
    public int ShowTypeId { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public ShowType ShowType { get; set; } = null!;
    public ICollection<ShowSchedule> Schedules { get; set; } = [];
}

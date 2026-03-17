using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("show_schedule")]
public class ShowSchedule
{
    [Column("schedule_id")]
    public int ScheduleId { get; set; }

    [Column("tv_show_id")]
    public int TvShowId { get; set; }

    [Column("start_datetime")]
    public DateTimeOffset StartDatetime { get; set; }

    [Column("air_date")]
    public DateOnly AirDate { get; set; }

    [Column("air_time")]
    public TimeOnly AirTime { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public TvShow TvShow { get; set; } = null!;
    public ICollection<Request> Requests { get; set; } = [];
}

using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("show_type")]
public class ShowType
{
    [Column("show_type_id")]
    public int ShowTypeId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    // Navigation
    public ICollection<TvShow> TvShows { get; set; } = [];
}

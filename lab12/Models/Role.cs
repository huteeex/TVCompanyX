using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("role")]
public class Role
{
    [Column("role_id")]
    public int RoleId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    public ICollection<User> Users { get; set; } = [];
}

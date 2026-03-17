using System.ComponentModel.DataAnnotations.Schema;

namespace Lab12TVCompanyX.Models;

[Table("chat_message")]
public class ChatMessage
{
    [Column("message_id")]
    public int MessageId { get; set; }

    [Column("request_id")]
    public int RequestId { get; set; }

    [Column("sender_id")]
    public int SenderId { get; set; }

    [Column("content")]
    public string Content { get; set; } = null!;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation
    public Request Request { get; set; } = null!;
    public User Sender { get; set; } = null!;
}

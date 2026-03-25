using System.Security.Cryptography;
using System.Text;

namespace Lab12TVCompanyX.Utils;
public static class PasswordHelper
{
    public static string ComputeSha256(string plainText)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plainText));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
    public static bool Verify(string plainText, string storedHash)
    {
        var computed = ComputeSha256(plainText);
        return string.Equals(computed, storedHash, StringComparison.OrdinalIgnoreCase);
    }
}

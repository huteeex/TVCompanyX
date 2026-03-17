using System.Security.Cryptography;
using System.Text;

namespace Lab12TVCompanyX.Utils;

/// <summary>
/// Утилиты хеширования паролей по алгоритму SHA-256.
/// Хеш хранится и передаётся в виде строки нижнего регистра hex
/// (64 символа), например: "5e884898da..."
/// </summary>
public static class PasswordHelper
{
    /// <summary>
    /// Вычисляет SHA-256 хеш от открытого текста и возвращает hex-строку
    /// в нижнем регистре (64 символа).
    /// </summary>
    public static string ComputeSha256(string plainText)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plainText));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Сравнивает открытый пароль с сохранённым SHA-256 хешем.
    /// Сравнение нечувствительно к регистру (оба приводятся к нижнему).
    /// </summary>
    public static bool Verify(string plainText, string storedHash)
    {
        var computed = ComputeSha256(plainText);
        return string.Equals(computed, storedHash, StringComparison.OrdinalIgnoreCase);
    }
}

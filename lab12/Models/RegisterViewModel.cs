using System.ComponentModel.DataAnnotations;

namespace Lab12TVCompanyX.Models;

public class RegisterViewModel
{
    [Required(ErrorMessage = "Введите имя")]
    [Display(Name = "Имя")]
    public string FirstName { get; set; } = null!;

    [Required(ErrorMessage = "Введите фамилию")]
    [Display(Name = "Фамилия")]
    public string LastName { get; set; } = null!;

    [Display(Name = "Отчество")]
    public string? MiddleName { get; set; }

    [Required(ErrorMessage = "Введите email")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    [Display(Name = "Email")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Введите пароль")]
    [MinLength(6, ErrorMessage = "Пароль должен содержать минимум 6 символов")]
    [DataType(DataType.Password)]
    [Display(Name = "Пароль")]
    public string Password { get; set; } = null!;

    [Required(ErrorMessage = "Подтвердите пароль")]
    [DataType(DataType.Password)]
    [Compare("Password", ErrorMessage = "Пароли не совпадают")]
    [Display(Name = "Подтверждение пароля")]
    public string ConfirmPassword { get; set; } = null!;

    [Phone(ErrorMessage = "Некорректный формат телефона")]
    [Display(Name = "Телефон")]
    public string? Phone { get; set; }
}

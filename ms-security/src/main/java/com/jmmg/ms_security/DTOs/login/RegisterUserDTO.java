package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterUserDTO(
        @NotBlank(message = "Name is required")
        String name,
        @NotBlank(message = "Last name is required")
        String lastName,
        @Email(message = "Email format is invalid")
        @NotBlank(message = "Email is required")
        String email,
        @NotBlank(message = "Password is required")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
                message = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
        )
        String password,
        @NotBlank(message = "Password confirmation is required")
        String confirmPassword) {
}
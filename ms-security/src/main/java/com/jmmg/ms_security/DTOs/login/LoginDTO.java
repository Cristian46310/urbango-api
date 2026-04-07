package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginDTO(
	@NotBlank(message = "Email is required")
	@Email(message = "Email should be valid")
	String email,
	@NotBlank(message = "Password is required")
	@Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$",
                message = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
        )
	String password
) {
}

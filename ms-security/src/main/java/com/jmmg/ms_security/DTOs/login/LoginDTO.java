package com.jmmg.ms_security.DTOs.login;

import com.jmmg.ms_security.models.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginDTO(
	@NotBlank(message = "Email is required")
	@Email(message = "Email should be valid")
	String email,
	@NotBlank(message = "Password is required")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$", message = "Password must be at least 8 characters long and contain both letters and numbers")
	String password
) {
	public User toModel() {
		User user = new User();
		user.setEmail(email);
		user.setPassword(password);
		return user;
	}
}

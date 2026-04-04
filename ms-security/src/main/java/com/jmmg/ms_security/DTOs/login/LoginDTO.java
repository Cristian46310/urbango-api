package com.jmmg.ms_security.DTOs.login;

import com.jmmg.ms_security.models.User;

public record LoginDTO(
	String email,
	String password
) {
	public User toModel() {
		User user = new User();
		user.setEmail(email);
		user.setPassword(password);
		return user;
	}
}

package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.User;

public record GetUserDTO(
	String id,
	String name,
	String email,
	String password
) {
	public static GetUserDTO fromModel(User user) {
		if (user == null) {
			return null;
		}
		return new GetUserDTO(user.getId(), user.getName(), user.getEmail(), user.getPassword());
	}

	public User toModel() {
		User user = new User(name, email, password);
		user.setId(id);
		return user;
	}
}

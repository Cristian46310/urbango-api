package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.User;

public record GetUserDTO(
	String id,
	String name,
	String email
) {
	public static GetUserDTO fromModel(User user) {
		if (user == null) {
			return null;
		}
		return new GetUserDTO(user.getId(), user.getName(), user.getEmail());
	}

}

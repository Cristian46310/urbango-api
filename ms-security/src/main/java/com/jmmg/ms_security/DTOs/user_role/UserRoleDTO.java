package com.jmmg.ms_security.DTOs.user_role;

import com.jmmg.ms_security.models.UserRole;

public record UserRoleDTO(
	String id,
	String userId,
	String roleId
) {
	public static UserRoleDTO fromModel(UserRole userRole) {
		if (userRole == null) {
			return null;
		}
		return new UserRoleDTO(
			userRole.getIdAsString(),
			userRole.getUser() != null ? userRole.getUser().getIdAsString() : null,
			userRole.getRole() != null ? userRole.getRole().getIdAsString() : null
		);
	}

}

package com.jmmg.ms_security.DTOs.user_role;

import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.User;
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
			userRole.getId(),
			userRole.getUser() != null ? userRole.getUser().getId() : null,
			userRole.getRole() != null ? userRole.getRole().getId() : null
		);
	}

}

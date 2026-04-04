package com.jmmg.ms_security.DTOs.Role;

import com.jmmg.ms_security.models.Role;
																																																																							
public record GetRoleDTO(
	String id,
	String name,
	String description
) {
	public static GetRoleDTO fromModel(Role role) {
		if (role == null) {
			return null;
		}
		return new GetRoleDTO(role.getId(), role.getName(), role.getDescription());
	}

	public Role toModel() {
		Role role = new Role(name, description);
		role.setId(id);
		return role;
	}
}

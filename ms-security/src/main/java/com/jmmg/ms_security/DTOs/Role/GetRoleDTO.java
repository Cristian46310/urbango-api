package com.jmmg.ms_security.DTOs.Role;

import java.util.List;

import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.models.Role;
																																																																							
public record GetRoleDTO(
	String id,
	String name,
	String description,
	List<GetPermissionDTO> permissions
) {
	public static GetRoleDTO fromModel(Role role) {
		return fromModel(role, List.of());
	}

	public static GetRoleDTO fromModel(Role role, List<GetPermissionDTO> permissions) {
		if (role == null) {
			return null;
		}
		return new GetRoleDTO(role.getIdAsString(), role.getName(), role.getDescription(), permissions);
	}

	public Role toModel() {
		Role role = new Role(name, description);
		role.setIdFromString(id);
		return role;
	}
}

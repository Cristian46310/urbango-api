package com.jmmg.ms_security.DTOs.Role;

import com.jmmg.ms_security.models.Role;

public record PostRoleDTO(
    String name,
    String description
) {
    public static PostRoleDTO fromModel(Role role) {
        if (role == null) {
            return null;
        }
        return new PostRoleDTO(role.getName(), role.getDescription());
    }
}

package com.jmmg.ms_security.DTOs.Role;

import com.jmmg.ms_security.models.Role;

public record GetRoleListDTO(
        String id,
        String name,
        String description) {

    public static GetRoleListDTO fromModel(Role role) {
        if (role == null) {
            return null;
        }
        return new GetRoleListDTO(role.getIdAsString(), role.getName(), role.getDescription());
    }
}

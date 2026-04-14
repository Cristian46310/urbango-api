package com.jmmg.ms_security.DTOs.user;

import com.jmmg.ms_security.models.Role;

public record RoleSummaryDTO(
        String id,
        String name,
        String description) {

    public static RoleSummaryDTO fromModel(Role role) {
        if (role == null) {
            return null;
        }
        return new RoleSummaryDTO(role.getId(), role.getName(), role.getDescription());
    }
}

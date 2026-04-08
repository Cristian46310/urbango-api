package com.jmmg.ms_security.DTOs.Role;

import com.jmmg.ms_security.models.Role;

import jakarta.validation.constraints.NotBlank;

public record PostRoleDTO(
    @NotBlank(message = "Name is required")
    String name,
    @NotBlank(message = "Description is required")
    String description
) {
    public static PostRoleDTO fromModel(Role role) {
        if (role == null) {
            return null;
        }
        return new PostRoleDTO(role.getName(), role.getDescription());
    }
}

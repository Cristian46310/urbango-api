package com.jmmg.ms_security.DTOs.Role;


public record GetSumaryRoleDTO(
    String name,
    String description
) {
    public static GetSumaryRoleDTO fromModel(GetRoleDTO role) {
        if (role == null) {
            return null;
        }
        return new GetSumaryRoleDTO(role.name(), role.description());
    }
}

package com.jmmg.ms_security.DTOs.permission;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssignPermissionsDTO(
        @NotBlank(message = "Role ID is required")
        String roleId,
        @Size(min = 1, message = "At least one permission ID must be provided")
        List<String> permissionIds) {
}

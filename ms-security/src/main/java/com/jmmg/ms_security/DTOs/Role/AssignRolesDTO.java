package com.jmmg.ms_security.DTOs.Role;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssignRolesDTO(
    @NotBlank(message = "User ID is required")
    String userId,
    @Size(min = 1, message = "At least one role ID must be provided")
    List<String> roleIds
) {
}
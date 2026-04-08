package com.jmmg.ms_security.DTOs.permission;

import com.jmmg.ms_security.models.Method;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PostPermissionDTO(
        @NotBlank(message = "URL is required")
        @Pattern(regexp = "^/[^\\s]*$", message = "URL should start with '/'")
        String url,
        Method method) {
}

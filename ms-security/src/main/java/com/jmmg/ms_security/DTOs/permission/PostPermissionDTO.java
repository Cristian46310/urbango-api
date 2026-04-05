package com.jmmg.ms_security.DTOs.permission;

import com.jmmg.ms_security.models.Method;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PostPermissionDTO(
        @NotBlank(message = "URL is required") @Pattern(regexp = "^(http|https)://[^\\s]+$", message = "URL should be a valid HTTP or HTTPS URL") String url,
        @NotBlank(message = "HTTP method is required")

        Method method) {
}

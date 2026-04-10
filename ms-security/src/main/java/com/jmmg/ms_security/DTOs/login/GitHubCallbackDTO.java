package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.NotBlank;

public record GitHubCallbackDTO(
        @NotBlank(message = "GitHub code is required")
        String code,
        @NotBlank(message = "GitHub state is required")
        String state) {
}

package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.NotBlank;

public record GoogleTokenDTO(
        @NotBlank(message = "Google idToken is required")
        String idToken
) {
}

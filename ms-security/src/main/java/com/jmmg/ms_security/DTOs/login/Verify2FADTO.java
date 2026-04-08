package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record Verify2FADTO(
        @NotBlank(message = "Challenge token is required")
        String challengeToken,
        @NotBlank(message = "Authentication code is required")
        @Pattern(regexp = "^\\d+$", message = "Authentication code must be numeric")
        String code) {
}

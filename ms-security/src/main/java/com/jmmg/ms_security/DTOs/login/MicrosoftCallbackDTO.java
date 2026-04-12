package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.NotBlank;

public record MicrosoftCallbackDTO(
        @NotBlank(message = "Microsoft code is required")
        String code,
        @NotBlank(message = "Microsoft state is required")
        String state) {
}

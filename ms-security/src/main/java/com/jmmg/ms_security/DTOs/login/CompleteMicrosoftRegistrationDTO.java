package com.jmmg.ms_security.DTOs.login;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CompleteMicrosoftRegistrationDTO(
        @NotBlank(message = "Registration token is required")
        String registrationToken,
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        String email) {
}

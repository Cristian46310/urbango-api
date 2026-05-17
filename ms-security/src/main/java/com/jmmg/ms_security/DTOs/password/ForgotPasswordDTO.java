package com.jmmg.ms_security.DTOs.password;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordDTO(
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        String email,
        @NotBlank(message = "reCAPTCHA token is required")
        String recaptchaToken
        ) {

}

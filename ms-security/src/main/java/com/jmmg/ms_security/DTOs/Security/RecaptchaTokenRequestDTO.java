package com.jmmg.ms_security.DTOs.Security;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RecaptchaTokenRequestDTO {
    @NotBlank(message = "El token de reCAPTCHA no puede estar vacío")
    private String token;
}

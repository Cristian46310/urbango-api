package com.jmmg.ms_security.DTOs.auth;

import jakarta.validation.constraints.NotBlank;

public record AuthorizationRequest(
    @NotBlank(message = "Method is required")
    String method,
    
    @NotBlank(message = "URL is required")
    String url
) {
}
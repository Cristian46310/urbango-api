package com.jmmg.ms_security.DTOs.auth;

import java.util.List;

public record ValidateTokenResponseDTO(
        String id,
        String name,
        String email,
        List<String> roles,
        long createdAt) {
}

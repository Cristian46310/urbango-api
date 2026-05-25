package com.jmmg.ms_security.DTOs.auth;

import java.util.List;

public record ValidatedTokenClaims(
        String id,
        String name,
        String email,
        List<String> rolesFromToken,
        long createdAt) {
}

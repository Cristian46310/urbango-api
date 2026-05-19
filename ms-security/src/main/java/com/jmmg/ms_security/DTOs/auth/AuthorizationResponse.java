package com.jmmg.ms_security.DTOs.auth;

public record AuthorizationResponse(
    boolean allowed,
    String reason
) {
    public AuthorizationResponse(boolean allowed) {
        this(allowed, null);
    }
}
package com.jmmg.ms_security.DTOs.login;

public record GitHubUserEmailDTO(
        String email,
        Boolean primary,
        Boolean verified,
        String visibility) {
}

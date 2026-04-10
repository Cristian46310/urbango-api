package com.jmmg.ms_security.DTOs.login;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GitHubUserProfileDTO(
        Long id,
        String login,
        String name,
        String email,
        @JsonProperty("avatar_url")
        String avatarUrl,
        @JsonProperty("html_url")
        String htmlUrl) {
}

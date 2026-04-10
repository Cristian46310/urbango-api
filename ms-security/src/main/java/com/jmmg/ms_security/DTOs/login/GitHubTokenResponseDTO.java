package com.jmmg.ms_security.DTOs.login;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GitHubTokenResponseDTO(
        @JsonProperty("access_token")
        String accessToken,
        @JsonProperty("token_type")
        String tokenType,
        String scope) {
}

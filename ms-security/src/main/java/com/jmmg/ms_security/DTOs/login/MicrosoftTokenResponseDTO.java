package com.jmmg.ms_security.DTOs.login;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MicrosoftTokenResponseDTO(
        @JsonProperty("token_type")
        String tokenType,
        String scope,
        @JsonProperty("expires_in")
        Long expiresIn,
        @JsonProperty("access_token")
        String accessToken,
        @JsonProperty("id_token")
        String idToken) {
}

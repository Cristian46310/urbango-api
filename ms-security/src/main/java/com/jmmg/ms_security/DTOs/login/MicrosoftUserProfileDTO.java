package com.jmmg.ms_security.DTOs.login;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MicrosoftUserProfileDTO(
        String id,
        String mail,
        @JsonProperty("userPrincipalName")
        String userPrincipalName,
        @JsonProperty("displayName")
        String displayName,
        @JsonProperty("givenName")
        String givenName,
        String surname,
        @JsonProperty("mobilePhone")
        String mobilePhone) {
}

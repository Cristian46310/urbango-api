package com.jmmg.ms_security.DTOs.login;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jmmg.ms_security.DTOs.user.GetUserDTO;

public record MicrosoftAuthResultDTO(
        String status,
        String message,
        String token,
        String registrationToken,
        Boolean linked,
        Boolean created,
        GetUserDTO user) {

    @JsonProperty("idToken")
    public String idToken() {
        return this.token;
    }
}

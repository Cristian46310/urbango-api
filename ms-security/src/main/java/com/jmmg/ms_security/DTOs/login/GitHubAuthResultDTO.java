package com.jmmg.ms_security.DTOs.login;

import com.jmmg.ms_security.DTOs.user.GetUserDTO;

public record GitHubAuthResultDTO(
        String status,
        String message,
        String token,
        String registrationToken,
        Boolean linked,
        Boolean created,
        GetUserDTO user) {
}

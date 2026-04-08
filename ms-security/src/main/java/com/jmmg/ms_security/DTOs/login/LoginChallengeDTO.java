package com.jmmg.ms_security.DTOs.login;

import java.util.Date;

public record LoginChallengeDTO(
        String challengeToken,
        Date expiration,
        String message) {
}

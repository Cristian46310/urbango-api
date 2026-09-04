package com.jmmg.ms_security.DTOs.login;

import java.time.Instant;

public record LoginChallengeDTO(
        String challengeToken,
        Instant expiration,
        String message) {
}

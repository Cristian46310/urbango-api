package com.jmmg.ms_security.DTOs.Session;

import java.util.Date;

public record PostSessionDTO(
    String token,
    Date expiration,
    String code2FA,
    String userId
) {
}

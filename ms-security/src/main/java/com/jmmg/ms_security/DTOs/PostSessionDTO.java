package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.Session;

import java.util.Date;

public record PostSessionDTO(
    String token,
    Date expiration,
    String code2FA,
    String userId
) {
    public static PostSessionDTO fromModel(Session session) {
        if (session == null) {
            return null;
        }
        return new PostSessionDTO(
            session.getToken(),
            session.getExpiration(),
            session.getCode2FA(),
            session.getUser() != null ? session.getUser().getId() : null
        );
    }
}

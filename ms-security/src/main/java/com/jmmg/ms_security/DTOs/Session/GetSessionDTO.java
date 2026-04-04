package com.jmmg.ms_security.DTOs.Session;

import com.jmmg.ms_security.models.Session;
import com.jmmg.ms_security.models.User;

import java.util.Date;

public record GetSessionDTO(
	String id,
	String token,
	Date expiration,
	String code2FA,
	String userId
) {
	public static GetSessionDTO fromModel(Session session) {
		if (session == null) {
			return null;
		}
		return new GetSessionDTO(
			session.getId(),
			session.getToken(),
			session.getExpiration(),
			session.getCode2FA(),
			session.getUser() != null ? session.getUser().getId() : null
		);
	}

	public Session toModel() {
		Session session = new Session(token, expiration, code2FA);
		session.setId(id);
		if (userId != null) {
			User user = new User();
			user.setId(userId);
			session.setUser(user);
		}
		return session;
	}
}

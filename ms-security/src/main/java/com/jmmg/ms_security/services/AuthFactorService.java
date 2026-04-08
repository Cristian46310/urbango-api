package com.jmmg.ms_security.services;

import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.infra.config.AuthFactorProperties;
import com.jmmg.ms_security.models.AuthFactor;
import com.jmmg.ms_security.models.AuthFactorStatus;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IAuthFactor;

@Service
public class AuthFactorService {

	@Autowired
	private IAuthFactor authFactorRepository;

	@Autowired
	private AuthFactorProperties authFactorProperties;

	private final SecureRandom random = new SecureRandom();

	public AuthFactor createPendingFactor(User user) {
		this.cancelPendingFactors(user.getId());

		Date now = new Date();
		AuthFactor authFactor = new AuthFactor();
		authFactor.setUser(user);
		authFactor.setCode(this.generateNumericCode());
		authFactor.setToken(UUID.randomUUID().toString());
		authFactor.setExpiration(new Date(now.getTime() + this.authFactorProperties.getExpiration()));
		authFactor.setStatus(AuthFactorStatus.PENDING);
		authFactor.setCreatedAt(now);
		authFactor.setUpdatedAt(now);

		return this.authFactorRepository.save(authFactor);
	}

	public User validateFactor(String challengeToken, String code) {
		AuthFactor authFactor = this.authFactorRepository.findByTokenAndStatus(challengeToken, AuthFactorStatus.PENDING);
		if (authFactor == null) {
			return null;
		}

		Date now = new Date();
		if (authFactor.getExpiration() == null || authFactor.getExpiration().before(now)) {
			this.markAsCanceled(authFactor);
			return null;
		}

		if (code == null || !code.equals(authFactor.getCode())) {
			return null;
		}

		return authFactor.getUser();
	}

	public void consumeFactor(String challengeToken) {
		AuthFactor authFactor = this.authFactorRepository.findByTokenAndStatus(challengeToken, AuthFactorStatus.PENDING);
		if (authFactor != null) {
			this.markAsUsed(authFactor);
		}
	}

	private void cancelPendingFactors(String userId) {
		List<AuthFactor> pendingFactors = this.authFactorRepository.findByUserIdAndStatus(userId, AuthFactorStatus.PENDING);
		if (pendingFactors.isEmpty()) {
			return;
		}

		Date now = new Date();
		pendingFactors.forEach(factor -> {
			factor.setStatus(AuthFactorStatus.CANCELED);
			factor.setUpdatedAt(now);
		});

		this.authFactorRepository.saveAll(pendingFactors);
	}

	private void markAsUsed(AuthFactor authFactor) {
		authFactor.setStatus(AuthFactorStatus.USED);
		authFactor.setUpdatedAt(new Date());
		this.authFactorRepository.save(authFactor);
	}

	private void markAsCanceled(AuthFactor authFactor) {
		authFactor.setStatus(AuthFactorStatus.CANCELED);
		authFactor.setUpdatedAt(new Date());
		this.authFactorRepository.save(authFactor);
	}

	private String generateNumericCode() {
		int length = this.authFactorProperties.getLength();
		StringBuilder code = new StringBuilder(length);

		for (int i = 0; i < length; i++) {
			code.append(this.random.nextInt(10));
		}

		return code.toString();
	}
}

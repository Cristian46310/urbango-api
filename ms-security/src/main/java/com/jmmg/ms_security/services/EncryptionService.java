package com.jmmg.ms_security.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {

    private final PasswordEncoder passwordEncoder;

    public EncryptionService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    /** Hash a raw password with BCrypt. */
    public String encode(String rawPassword) {
        if (rawPassword == null) {
            return null;
        }
        return this.passwordEncoder.encode(rawPassword);
    }

    /** Verify raw password against stored BCrypt hash. */
    public boolean matches(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null || encodedPassword.isBlank()) {
            return false;
        }
        return this.passwordEncoder.matches(rawPassword, encodedPassword);
    }
}

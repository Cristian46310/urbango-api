package com.jmmg.ms_security.infra.exception;

public class InvalidCredentials extends RuntimeException {
    public InvalidCredentials() {
        super("Invalid credentials");
    }

    public InvalidCredentials(String message) {
        super(message);
    }
}

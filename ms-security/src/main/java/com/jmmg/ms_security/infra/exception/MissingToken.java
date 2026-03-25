package com.jmmg.ms_security.infra.exception;

/**
 * Exception thrown to indicate that a required authentication token is missing from the request header.
 * <p>
 * This exception can be used in authentication or authorization filters to signal that the client
 * did not provide the necessary token for accessing protected resources.
 * </p>
 *
 * <p>
 * Several constructors are provided to allow for custom messages and exception chaining.
 * </p>
 */
public class MissingToken extends RuntimeException {
    public MissingToken() {
        super("Missing token in the request header.");
    }

    public MissingToken(String message) {
        super(message);
    }

    public MissingToken(String message, Throwable cause) {
        super(message, cause);
    }

    public MissingToken(Throwable cause) {
        super(cause);
    }

    public MissingToken(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }

}

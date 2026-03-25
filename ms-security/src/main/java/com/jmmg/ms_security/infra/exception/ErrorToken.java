package com.jmmg.ms_security.infra.exception;

/**
 * Custom exception class representing errors related to token processing or validation.
 * <p>
 * This exception is typically thrown when there is an issue with authentication or authorization tokens,
 * such as invalid, expired, or malformed tokens.
 * </p>
 *
 * <p>
 * This class extends {@link RuntimeException}, allowing it to be thrown without being declared in a method's
 * {@code throws} clause.
 * </p>
 *
 * <ul>
 *   <li>{@link #ErrorToken()} - Constructs a new exception with {@code null} as its detail message.</li>
 *   <li>{@link #ErrorToken(String)} - Constructs a new exception with the specified detail message.</li>
 *   <li>{@link #ErrorToken(String, Throwable)} - Constructs a new exception with the specified detail message and cause.</li>
 *   <li>{@link #ErrorToken(Throwable)} - Constructs a new exception with the specified cause.</li>
 *   <li>{@link #ErrorToken(String, Throwable, boolean, boolean)} - Constructs a new exception with full control over suppression and stack trace writability.</li>
 * </ul>
 */
public class ErrorToken extends RuntimeException{
    
    public ErrorToken() {
        super();
    }

    public ErrorToken(String message) {
        super(message);
    }

    public ErrorToken(String message, Throwable cause) {
        super(message, cause);
    }

    public ErrorToken(Throwable cause) {
        super(cause);
    }

    public ErrorToken(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}

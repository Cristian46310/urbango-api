package com.jmmg.ms_security.infra.exception;

/**
 * Exception thrown to indicate that the requested data was not found.
 * <p>
 * This exception extends {@link RuntimeException} and can be used to signal
 * that a particular data entity or resource could not be located.
 * </p>
 *
 * <p>
 * Multiple constructors are provided to allow for custom messages and causes.
 * </p>
 */
public class DataNotFound extends RuntimeException {
    public DataNotFound() {
        super("Data not found.");
    }

    public DataNotFound(String message) {
        super(message);
    }

    public DataNotFound(String message, Throwable cause) {
        super(message, cause);
    }

    public DataNotFound(Throwable cause) {
        super(cause);
    }

    public DataNotFound(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }

}

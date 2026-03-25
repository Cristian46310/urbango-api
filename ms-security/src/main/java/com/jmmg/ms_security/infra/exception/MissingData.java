package com.jmmg.ms_security.infra.exception;

/**
 * Exception thrown to indicate that required data is missing from the request body.
 * <p>
 * This exception can be used in RESTful APIs or other contexts where input validation
 * is necessary and certain fields or data are required for processing a request.
 * </p>
 *
 * <p>
 * Several constructors are provided to allow for custom messages and exception chaining.
 * </p>
 *
 * @author juan-manoel
 */
public class MissingData extends RuntimeException {
    public MissingData() {
        super("Missing data in the request body.");
    }

    public MissingData(String message) {
        super(message);
    }

    public MissingData(String message, Throwable cause) {
        super(message, cause);
    }

    public MissingData(Throwable cause) {
        super(cause);
    }

    public MissingData(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }

}

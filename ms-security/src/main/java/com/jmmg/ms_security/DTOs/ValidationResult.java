package com.jmmg.ms_security.DTOs;

public class ValidationResult {
    private boolean success;
    private String message;
    private ValidationErrorType errorType;
    
    // Constructor para caso exitoso
    public ValidationResult() {
        this.success = true;
        this.message = null;
        this.errorType = null;
    }
    
    // Constructor para errores
    public ValidationResult(boolean success, String message, ValidationErrorType errorType) {
        this.success = success;
        this.message = message;
        this.errorType = errorType;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public ValidationErrorType getErrorType() {
        return errorType;
    }
}

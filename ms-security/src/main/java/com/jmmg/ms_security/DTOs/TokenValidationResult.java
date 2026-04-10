package com.jmmg.ms_security.DTOs;

import com.jmmg.ms_security.models.User;

public class TokenValidationResult {
    private boolean valid;
    private String errorMessage;
    private ValidationErrorType errorType;
    private User user;
    
    public TokenValidationResult(boolean valid, String errorMessage, ValidationErrorType errorType, User user) {
        this.valid = valid;
        this.errorMessage = errorMessage;
        this.errorType = errorType;
        this.user = user;
    }
    
    public boolean isValid() {
        return valid;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public ValidationErrorType getErrorType() {
        return errorType;
    }
    
    public User getUser() {
        return user;
    }
}

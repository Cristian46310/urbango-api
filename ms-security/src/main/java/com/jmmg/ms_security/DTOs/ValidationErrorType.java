package com.jmmg.ms_security.DTOs;

public enum ValidationErrorType {
    TOKEN_MISSING("Sesión expirada o inválida"),
    TOKEN_INVALID("Token inválido o malformado"),
    TOKEN_EXPIRED("Sesión expirada o inválida"),
    FORBIDDEN("Acceso denegado"),
    INTERNAL_ERROR("Error interno del servidor");
    
    private String defaultMessage;
    
    ValidationErrorType(String defaultMessage) {
        this.defaultMessage = defaultMessage;
    }
    
    public String getDefaultMessage() {
        return defaultMessage;
    }
}

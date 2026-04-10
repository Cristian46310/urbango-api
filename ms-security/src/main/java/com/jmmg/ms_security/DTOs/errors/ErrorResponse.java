package com.jmmg.ms_security.DTOs.errors;

public class ErrorResponse {
    private String message;
    private String error;
    private long timestamp;
    
    public ErrorResponse(String message, String error, long timestamp) {
        this.message = message;
        this.error = error;
        this.timestamp = timestamp;
    }
    
    public String getMessage() {
        return message;
    }
    
    public String getError() {
        return error;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
}

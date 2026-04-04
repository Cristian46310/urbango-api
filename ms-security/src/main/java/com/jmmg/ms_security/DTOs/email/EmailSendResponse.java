package com.jmmg.ms_security.DTOs.email;

public record EmailSendResponse(
    boolean success,
    String message_id,
    String error,
    String message
) {
    
}

package com.jmmg.ms_security.DTOs.email;

public record EmailSendBody(
    String to,
    String subject,
    String body
) {
    
}

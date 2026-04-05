package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.jmmg.ms_security.DTOs.email.EmailSendBody;
import com.jmmg.ms_security.DTOs.email.EmailSendResponse;
import com.jmmg.ms_security.infra.config.EmailProperties;

@Service
public class EmailService {

    @Autowired
    private EmailProperties emailProperties;

    @Autowired
    private RestTemplate restTemplate;

    public void sendEmail(EmailSendBody emailBody) {
        try {
            EmailSendResponse response = restTemplate.postForObject(
                emailProperties.getUrl(),
                emailBody,
                EmailSendResponse.class
            );
            
            if (response != null && !response.success()) {
                System.err.println("Error al enviar email: " + response.error());
            }
        } catch (Exception e) {
            System.err.println("Excepcion al enviar email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

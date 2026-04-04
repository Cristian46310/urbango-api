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


    public void sendRoleAssignmentNotification(String userEmail, String userName, String roleNames) {
        try {
            String emailContent = buildEmailContent(userName, roleNames);
            EmailSendBody emailBody = new EmailSendBody(
                userEmail,
                "Notificación de Asignación de Roles",
                emailContent
            );
            
            EmailSendResponse response = restTemplate.postForObject(
                emailProperties.getUrl(),
                emailBody,
                EmailSendResponse.class
            );
            
            if (response != null && !response.success()) {
                System.err.println("Error al enviar email: " + response.error());
            }
        } catch (Exception e) {
            System.err.println("Excepción al enviar notificación de email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildEmailContent(String userName, String roleNames) {
        return String.format(
                "Hola %s,\n\n"
                + "Te informamos que tus roles/permisos en el sistema han sido actualizados.\n\n"
                + "Roles asignados: %s\n\n"
                + "Si tienes dudas, contacta al administrador.\n\n"
                + "Saludos,\n"
                + "Sistema de Seguridad",
                userName, roleNames
        );
    }
}

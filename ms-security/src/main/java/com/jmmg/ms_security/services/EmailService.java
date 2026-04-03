package com.jmmg.ms_security.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendRoleAssignmentNotification(String userEmail, String userName, String roleNames) {
        try {
            if (mailSender == null) {
                logger.warn("JavaMailSender no configurado. Logueando notificación:");
                logger.info("NOTIFICACIÓN DE ASIGNACIÓN DE ROL:");
                logger.info("Usuario: {} ({})", userName, userEmail);
                logger.info("Roles asignados: {}", roleNames);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(userEmail);
            message.setSubject("Cambio en tus roles/permisos del sistema");
            message.setText(buildEmailContent(userName, roleNames));
            message.setFrom("noreply@ms-security.com");

            mailSender.send(message);
            logger.info("Email enviado exitosamente a: {}", userEmail);
        } catch (Exception e) {
            logger.error("Error al enviar email a {}: {}", userEmail, e.getMessage());
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

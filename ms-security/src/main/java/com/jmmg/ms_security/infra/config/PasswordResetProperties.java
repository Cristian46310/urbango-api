package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "password-reset")
public class PasswordResetProperties {
    private String baseUrl;
}

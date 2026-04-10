package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "google.oauth2")
public class GoogleProperties {
    private String clientId;
    private String clientSecret;    
}

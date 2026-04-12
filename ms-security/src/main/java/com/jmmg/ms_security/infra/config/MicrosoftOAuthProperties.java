package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "microsoft.oauth")
public class MicrosoftOAuthProperties {
    private String clientId;
    private String clientSecret;
    private String tenantId;
    private String redirectUri;
    private String authorizeUri;
    private String tokenUri;
    private String graphUri;
    private String jwkSetUri;
    private String scope;
    private Long stateExpiration;
}

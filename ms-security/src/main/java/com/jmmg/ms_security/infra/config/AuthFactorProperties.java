package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "auth.factor")
public class AuthFactorProperties {
    private Integer length;
    private Long expiration;
}

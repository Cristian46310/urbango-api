package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "security.internal")
public class InternalKeyProperties {

    /** Shared secret for ms-business / ms-messages → ms-security calls. */
    private String key = "";
}

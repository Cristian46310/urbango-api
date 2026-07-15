package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {

    /** Comma-separated allowed origins, e.g. http://localhost:5173,http://localhost:3000 */
    private String allowedOrigins = "http://localhost:5173,http://localhost:3000,http://localhost:3001";
}

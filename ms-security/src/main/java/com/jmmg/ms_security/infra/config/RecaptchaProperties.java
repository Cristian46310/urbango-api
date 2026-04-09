package com.jmmg.ms_security.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "recaptcha")
public class RecaptchaProperties {
    private String secretKey;
    private String siteKey;
    private String verifyUrl;
}

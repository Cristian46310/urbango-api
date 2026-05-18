package com.jmmg.ms_security.configurations;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jmmg.ms_security.Interceptors.SecurityInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private SecurityInterceptor securityInterceptor;

    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(securityInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                    "/api/public/**", // Rutas públicas: login, registro
                    "/api/permissions/**",         
                    "/api/role-permission/**",      
                    "/api/health",       // Health check
                    "/api/docs/**",      // Swagger/OpenAPI
                    "/swagger-ui/**",
                    "/v3/api-docs/**"
                )
                .excludeHttpMethods(HttpMethod.OPTIONS);
    }

}

package com.jmmg.ms_security.services;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.MediaType;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jmmg.ms_security.infra.config.RecaptchaProperties;

import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RecaptchaService {
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final RecaptchaProperties recaptchaProperties;

    public RecaptchaService(WebClient.Builder webClientBuilder, 
        ObjectMapper objectMapper, RecaptchaProperties recaptchaProperties) {
        // Construye el cliente HTTP reactivo para realizar llamadas al servicio de verificación de reCAPTCHA
        this.webClient = webClientBuilder.build();
        // Convierte los objetos en JSON y viceversa
        this.objectMapper = objectMapper;
        this.recaptchaProperties = recaptchaProperties;
        log.info("RecaptchaService initialized with verify URL: {}", recaptchaProperties.getVerifyUrl());
    }

    //Mono es un tipo de dato que representa una operación asíncrona que puede emitir un solo valor o ningún valor. 
    // En este caso, se utiliza para manejar la respuesta de la verificación de reCAPTCHA de manera reactiva.
    public Mono<Boolean> verifyToken(String token) {
        log.debug("Verificando token de reCAPTCHA");
        
        String requestBody = String.format("secret=%s&response=%s", 
            recaptchaProperties.getSecretKey(), 
            token);
        
        return webClient.post()
                .uri(recaptchaProperties.getVerifyUrl())
                // Especificar el Content-Type correcto para form-urlencoded
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                // Enviamos los parámetros esperados por Google:
                // - secret: clave privada
                // - response: token del usuario
                .bodyValue(requestBody)
                //devuelve la respuesta del servicio de verificación de reCAPTCHA como un Mono de String
                // Realiza la solicitud HTTP, obtiene la respuesta como String y la procesa
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), clientResponse -> {
                    log.warn("Google reCAPTCHA API returned status: {}", clientResponse.statusCode());
                    return clientResponse.bodyToMono(String.class)
                            .flatMap(body -> Mono.error(new RuntimeException("reCAPTCHA API error: " + body)));
                })
                // Convierte la respuesta en un Mono<String> (JSON en texto)
                .bodyToMono(String.class)
                .map(response-> {
                    try{
                        log.debug("Google response: {}", response);
                        // Convierte el String JSON en un objeto JsonNode
                        JsonNode jsonResponse = objectMapper.readTree(response);
                        // "success" indica si Google validó correctamente el token
                        boolean success = jsonResponse.get("success").asBoolean();
                         // "score" es un valor de 0.0 a 1.0 (probabilidad de que sea humano)
                        double score = jsonResponse.has("score") ? jsonResponse.get("score").asDouble() : 1.0;
                        
                        log.info("reCAPTCHA validation - Success: {}, Score: {}", success, score);
                        
                        return success && score >= 0.5;
                    } catch (Exception e) {
                        log.error("Error parsing reCAPTCHA response", e);
                        return false;
                    }
                })
                .onErrorResume(e -> {
                    log.error("Error validating reCAPTCHA token", e);
                    return Mono.just(false);
                });
    }
}

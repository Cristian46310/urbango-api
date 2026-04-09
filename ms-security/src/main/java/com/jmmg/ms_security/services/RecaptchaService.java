package com.jmmg.ms_security.services;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jmmg.ms_security.infra.config.RecaptchaProperties;

import reactor.core.publisher.Mono;

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
    }
    //Mono es un tipo de dato que representa una operación asíncrona que puede emitir un solo valor o ningún valor. 
    // En este caso, se utiliza para manejar la respuesta de la verificación de reCAPTCHA de manera reactiva.
    public Mono<Boolean> verifyToken(String token) {
        return webClient.post()
                .uri(recaptchaProperties.getVerifyUrl())
                // Enviamos los parámetros esperados por Google:
                // - secret: clave privada
                // - response: token del usuario
                .bodyValue(String.format("secret=%s&response=%s", recaptchaProperties.getSecretKey(), token))
                //devuelve la respuesta del servicio de verificación de reCAPTCHA como un Mono de String
                // Realiza la solicitud HTTP, obtiene la respuesta como String y la procesa
                .retrieve()
                // Convierte la respuesta en un Mono<String> (JSON en texto)
                .bodyToMono(String.class)
                .map(response-> {
                    try{
                        // Convierte el String JSON en un objeto JsonNode
                        JsonNode jsonREsponse = objectMapper.readTree(response);
                        // "success" indica si Google validó correctamente el token
                        boolean succes = jsonREsponse.get("success").asBoolean();
                         // "score" es un valor de 0.0 a 1.0 (probabilidad de que sea humano)
                        double score = jsonREsponse.has("score") ? jsonREsponse.get("score").asDouble() : 1.0;
                        return succes && score >= 0.5;
                    } catch (Exception e) {
                        return false;
                    }
                });
    }
    


}

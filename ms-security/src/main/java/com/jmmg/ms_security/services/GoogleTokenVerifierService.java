package com.jmmg.ms_security.services;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleTokenVerifierService {

    // Client ID registrado en Google Cloud Console para validar que el token fue emitido para esta app.
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    public GoogleIdToken.Payload verify(String idTokenString) {
        try {
            // Construye el verificador oficial de Google y restringe la audiencia al client-id de este backend.
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            // Verifica firma, expiración y validez general del token.
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid ID token.");
            }

            // Extrae los datos del usuario autenticado por Google.
            GoogleIdToken.Payload payload = idToken.getPayload();

            // Valida que el email de la cuenta Google ya esté verificado.
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new RuntimeException("Email not verified.");
            }

            // Retorna los claims para que SecurityService pueda buscar/crear usuario y emitir JWT interno.
            return payload;
        } catch (Exception e) {
            // Propaga error controlado para que la capa superior responda 401 cuando corresponda.
            throw new RuntimeException("Error verifying ID token.", e);
        }
    }
}

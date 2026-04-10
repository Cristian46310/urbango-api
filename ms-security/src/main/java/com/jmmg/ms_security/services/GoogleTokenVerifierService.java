package com.jmmg.ms_security.services;

import java.util.Collections;

import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.jmmg.ms_security.infra.config.GoogleProperties;

@Service
public class GoogleTokenVerifierService {

    private final GoogleProperties googleProperties;

    public GoogleTokenVerifierService(GoogleProperties googleProperties) {
        this.googleProperties = googleProperties;
    }

    public GoogleIdToken.Payload verify(String idTokenString) {
        try {
            // Construye el verificador oficial de Google y restringe la audiencia al client-id de este backend.
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleProperties.getClientId()))
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

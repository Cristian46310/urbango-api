package com.jmmg.ms_security.services;

import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.infra.config.JwtProperties;
import com.jmmg.ms_security.models.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    @Autowired
    private JwtProperties jwtProperties;

    // Crea una clave de firma determinista a partir de la configuración para que los tokens sigan siendo válidos durante los reinicios.
    private Key getSecretKey() {
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-512")
                    .digest(jwtProperties.getSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to initialize JWT signing key", e);
        }
    }

    public String generateToken(User theUser) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", theUser.getId());
        claims.put("name", theUser.getName());
        claims.put("email", theUser.getEmail());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(theUser.getId())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
            .signWith(getSecretKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public User getUserFromToken(String token) {
        try {
            Jws<Claims> claimsJws = Jwts.parserBuilder()
                    .setSigningKey(getSecretKey())
                    .build()
                    .parseClaimsJws(token);

            Claims claims = claimsJws.getBody();

            User user = new User();
            user.setId((String) claims.get("id"));
            user.setName((String) claims.get("name"));
            user.setEmail((String) claims.get("email"));
            return user;
        } catch (Exception e) {
            // En caso de que el token sea inválido o haya expirado
            return null;
        }
    }
}

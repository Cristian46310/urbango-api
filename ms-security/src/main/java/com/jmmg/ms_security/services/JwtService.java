package com.jmmg.ms_security.services;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.jmmg.ms_security.infra.config.JwtProperties;
import com.jmmg.ms_security.models.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final Key secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        // Crear la llave secreta a partir de la cadena proporcionada
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
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
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jws<Claims> claimsJws = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);

            return true;
        } catch (SignatureException ex) {
            // La firma del token es inválida
            return false;
        } catch (Exception e) {
            // Otra excepción
            return false;
        }
    }

    public User getUserFromToken(String token) {
        try {
            Jws<Claims> claimsJws = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
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

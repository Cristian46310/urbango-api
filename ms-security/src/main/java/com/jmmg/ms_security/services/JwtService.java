package com.jmmg.ms_security.services;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.auth.ValidatedTokenClaims;
import com.jmmg.ms_security.infra.config.JwtProperties;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.repositories.IUserRoleRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;


@Service
public class JwtService {

    @Autowired
    
    private IUserRoleRepository userRoleRepository;

    @Autowired
    private JwtProperties jwtProperties;

    private Key getSecretKey() {
        return Keys.hmacShaKeyFor(this.jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User theUser) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

    Map<String, Object> claims = new HashMap<>();
    claims.put("id", theUser.getIdAsString());
    claims.put("name", theUser.getName());
    claims.put("email", theUser.getEmail());
    claims.put("createdAt", now.getTime());

    // Obtener roles desde UserRole
    List<String> roleNames = userRoleRepository.findByUserId(theUser.getId())
            .stream()
            .map(userRole -> userRole.getRole().getName())
            .toList();

    claims.put("roles", roleNames);

    return Jwts.builder()
            .setClaims(claims)
            .setSubject(theUser.getIdAsString())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(this.getSecretKey(), SignatureAlgorithm.HS256)
            .compact();
}
    public User getUserFromToken(String token) {
        ValidatedTokenClaims claims = parseValidToken(token);
        if (claims == null) {
            return null;
        }

        User user = new User();
        user.setIdFromString(claims.id());
        user.setName(claims.name());
        user.setEmail(claims.email());
        return user;
    }

    public long getCreatedAtFromToken(String token) {
        ValidatedTokenClaims claims = parseValidToken(token);
        if (claims == null) {
            return System.currentTimeMillis();
        }
        return claims.createdAt();
    }

    /**
     * Parsea y valida el JWT una sola vez (firma, expiración y claims mínimos).
     */
    @SuppressWarnings("unchecked")
    public ValidatedTokenClaims parseValidToken(String token) {
        try {
            Claims claims = parseClaims(token);

            String id = (String) claims.get("id");
            if (id == null || id.isBlank()) {
                id = claims.getSubject();
            }
            if (id == null || id.isBlank()) {
                return null;
            }

            Object createdAt = claims.get("createdAt");
            long createdAtMillis = createdAt instanceof Number number
                    ? number.longValue()
                    : claims.getIssuedAt() != null
                            ? claims.getIssuedAt().getTime()
                            : System.currentTimeMillis();

            List<String> rolesFromToken = List.of();
            Object rolesClaim = claims.get("roles");
            if (rolesClaim instanceof List<?> rolesList) {
                rolesFromToken = rolesList.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .toList();
            }

            return new ValidatedTokenClaims(
                    id,
                    (String) claims.get("name"),
                    (String) claims.get("email"),
                    rolesFromToken,
                    createdAtMillis);
        } catch (Exception e) {
            return null;
        }
    }

    private Claims parseClaims(String token) {
        Jws<Claims> claimsJws = Jwts.parserBuilder()
                .setSigningKey(this.getSecretKey())
                .build()
                .parseClaimsJws(token);
        return claimsJws.getBody();
    }
}

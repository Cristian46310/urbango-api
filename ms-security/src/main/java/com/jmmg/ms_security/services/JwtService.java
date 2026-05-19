package com.jmmg.ms_security.services;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    claims.put("id", theUser.getId());
    claims.put("name", theUser.getName());
    claims.put("email", theUser.getEmail());
    claims.put("createdAt", now.getTime());
    
    // Incluir enterpriseId si está presente
    if (theUser.getEnterpriseId() != null) {
        claims.put("enterpriseId", theUser.getEnterpriseId());
    }

    // Obtener roles desde UserRole
    List<String> roleNames = userRoleRepository.findByUserId(theUser.getId())
            .stream()
            .map(userRole -> userRole.getRole().getName())
            .toList();

    claims.put("roles", roleNames);

    return Jwts.builder()
            .setClaims(claims)
            .setSubject(theUser.getId())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(this.getSecretKey(), SignatureAlgorithm.HS256)
            .compact();
}
    public User getUserFromToken(String token) {
        try {
            Claims claims = parseClaims(token);

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

    public long getCreatedAtFromToken(String token) {
        try {
            Object createdAt = parseClaims(token).get("createdAt");
            if (createdAt instanceof Number number) {
                return number.longValue();
            }
        } catch (Exception ignored) {
            // Token inválido: el llamador ya validó al usuario
        }
        return System.currentTimeMillis();
    }

    private Claims parseClaims(String token) {
        Jws<Claims> claimsJws = Jwts.parserBuilder()
                .setSigningKey(this.getSecretKey())
                .build()
                .parseClaimsJws(token);
        return claimsJws.getBody();
    }
}

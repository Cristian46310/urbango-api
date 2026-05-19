package com.jmmg.ms_security.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jmmg.ms_security.DTOs.auth.AuthorizationRequest;
import com.jmmg.ms_security.DTOs.auth.AuthorizationResponse;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.services.JwtService;
import com.jmmg.ms_security.services.PermissionService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.validation.Valid;

import java.nio.charset.StandardCharsets;
import java.security.Key;

import org.springframework.beans.factory.annotation.Autowired;
import com.jmmg.ms_security.infra.config.JwtProperties;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
public class AuthorizationController {

    private final JwtService jwtService;
    private final PermissionService permissionService;
    private final JwtProperties jwtProperties;

    public AuthorizationController(JwtService jwtService, PermissionService permissionService,
            JwtProperties jwtProperties) {
        this.jwtService = jwtService;
        this.permissionService = permissionService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/authorize")
    public ResponseEntity<AuthorizationResponse> authorize(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody AuthorizationRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthorizationResponse(false, "Missing or malformed Authorization header"));
        }

        String token = authHeader.substring(7);

        if (!isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthorizationResponse(false, "Invalid or expired token"));
        }

        User user = this.jwtService.getUserFromToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthorizationResponse(false, "Unable to extract user from token"));
        }

        List<String> roles = extractRolesFromToken(token);

        boolean allowed = this.permissionService.isAllowed(roles, request.method(), request.url());

        if (allowed) {
            return ResponseEntity.ok(new AuthorizationResponse(true));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AuthorizationResponse(false, "Insufficient role"));
        }
    }

    private boolean isTokenValid(String token) {
        try {
            Key secretKey = Keys.hmacShaKeyFor(this.jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
            Jws<Claims> claimsJws = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return claimsJws.getBody().getExpiration().getTime() > System.currentTimeMillis();
        } catch (Exception e) {
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRolesFromToken(String token) {
        try {
            Key secretKey = Keys.hmacShaKeyFor(this.jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
            Jws<Claims> claimsJws = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return (List<String>) claimsJws.getBody().get("roles");
        } catch (Exception e) {
            return List.of();
        }
    }
}
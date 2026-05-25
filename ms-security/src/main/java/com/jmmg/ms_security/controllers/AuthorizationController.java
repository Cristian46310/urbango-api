package com.jmmg.ms_security.controllers;

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
import com.jmmg.ms_security.DTOs.auth.ValidatedTokenClaims;
import com.jmmg.ms_security.services.JwtService;
import com.jmmg.ms_security.services.PermissionService;

import jakarta.validation.Valid;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
public class AuthorizationController {

    private final JwtService jwtService;
    private final PermissionService permissionService;

    public AuthorizationController(JwtService jwtService, PermissionService permissionService) {
        this.jwtService = jwtService;
        this.permissionService = permissionService;
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
        ValidatedTokenClaims claims = this.jwtService.parseValidToken(token);
        if (claims == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthorizationResponse(false, "Invalid or expired token"));
        }

        boolean allowed = this.permissionService.isAllowed(
                claims.rolesFromToken(),
                request.method(),
                request.url());

        if (allowed) {
            return ResponseEntity.ok(new AuthorizationResponse(true));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AuthorizationResponse(false, "Insufficient role"));
        }
    }
}
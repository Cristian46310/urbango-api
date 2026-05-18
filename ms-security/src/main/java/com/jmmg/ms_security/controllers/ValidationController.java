package com.jmmg.ms_security.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jmmg.ms_security.DTOs.user.GetUserDetailDTO;
import com.jmmg.ms_security.services.JwtService;
import com.jmmg.ms_security.services.UserService;
import com.jmmg.ms_security.models.User;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@CrossOrigin
@RestController
@RequestMapping("/api/public/security")
public class ValidationController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    /**
     * Valida un token JWT y devuelve información del usuario con sus roles
     * 
     * Endpoint: POST /api/public/security/validate-token
     * Headers: Authorization: Bearer {token}
     * 
     * Response: {
     *   "id": "uuid",
     *   "name": "Juan",
     *   "email": "juan@example.com",
     *   "userId": "uuid",
     *   "roles": ["driver", "admin"]
     * }
     */
    @PostMapping("validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Validar formato Bearer
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing or invalid Authorization header"));
            }

            // Extraer token
            String token = authHeader.substring(7);

            // Validar token con JwtService
            User user = jwtService.getUserFromToken(token);
            if (user == null || user.getId() == null) {
                return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
            }

            // Obtener usuario completo con roles
            GetUserDetailDTO userDetail = userService.getDetailById(user.getId());
            if (userDetail == null) {
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
            }

            // Construir respuesta con roles
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("userId", user.getId()); // Compatibilidad frontend
            
            // Extraer solo los nombres de los roles
            if (userDetail.roles() != null) {
                var roleNames = userDetail.roles()
                    .stream()
                    .map(role -> role.name())
                    .toList();
                response.put("roles", roleNames);
            } else {
                response.put("roles", List.of());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Token validation failed: " + e.getMessage()));
        }
    }
}

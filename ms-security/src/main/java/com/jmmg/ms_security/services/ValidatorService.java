package com.jmmg.ms_security.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.TokenValidationResult;
import com.jmmg.ms_security.DTOs.ValidationErrorType;
import com.jmmg.ms_security.DTOs.ValidationResult;
import com.jmmg.ms_security.models.Permission;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.RolePermission;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import com.jmmg.ms_security.repositories.IPermissionRepository;
import com.jmmg.ms_security.repositories.IRolePermissionRepository;
import com.jmmg.ms_security.repositories.IUserRepository;
import com.jmmg.ms_security.repositories.IUserRoleRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class ValidatorService {
    @Autowired
    private JwtService jwtService;

    @Autowired
    private IPermissionRepository permissionRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRolePermissionRepository rolePermissionRepository;

    @Autowired
    private IUserRoleRepository userRoleRepository;

    private static final String BEARER = "Bearer ";

    /**
     * Valida una solicitud HTTP:
     * 1. Valida el token JWT
     * 2. Valida los permisos del usuario
     * 
     * @return ValidationResult con el resultado y tipo de error (si aplica)
     */
    public ValidationResult validateRequest(HttpServletRequest request, String url, String method) {
        // Paso 1: Validar token
        TokenValidationResult tokenValidation = validateToken(request);
        if (!tokenValidation.isValid()) {
            return new ValidationResult(
                false,
                tokenValidation.getErrorMessage(),
                tokenValidation.getErrorType()
            );
        }
        
        // Paso 2: Extraer usuario del token
        User user = tokenValidation.getUser();
        if (user == null) {
            return new ValidationResult(
                false,
                ValidationErrorType.TOKEN_INVALID.getDefaultMessage(),
                ValidationErrorType.TOKEN_INVALID
            );
        }
        
        // Paso 3: Validar permisos
        boolean hasPermission = validatePermissions(user, url, method);
        if (!hasPermission) {
            return new ValidationResult(
                false,
                ValidationErrorType.FORBIDDEN.getDefaultMessage(),
                ValidationErrorType.FORBIDDEN
            );
        }
        
        // Todo OK
        return new ValidationResult();
    }

    /**
     * Valida la existencia y validez del token JWT
     */
    private TokenValidationResult validateToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith(BEARER)) {
            return new TokenValidationResult(
                false,
                ValidationErrorType.TOKEN_MISSING.getDefaultMessage(),
                ValidationErrorType.TOKEN_MISSING,
                null
            );
        }
        
        String token = authHeader.substring(BEARER.length());
        User user = this.jwtService.getUserFromToken(token);
        
        if (user == null) {
            // El token es inválido o expiró
            return new TokenValidationResult(
                false,
                ValidationErrorType.TOKEN_EXPIRED.getDefaultMessage(),
                ValidationErrorType.TOKEN_EXPIRED,
                null
            );
        }
        
        // Cargar usuario completo desde BD
        User fullUser = this.userRepository.findById(user.getId()).orElse(null);
        if (fullUser == null) {
            return new TokenValidationResult(
                false,
                ValidationErrorType.TOKEN_INVALID.getDefaultMessage(),
                ValidationErrorType.TOKEN_INVALID,
                null
            );
        }
        
        return new TokenValidationResult(
            true,
            null,
            null,
            fullUser
        );
    }

    /**
     * Valida si el usuario tiene permisos para acceder a la URL/método solicitado
     */
    private boolean validatePermissions(User user, String url, String method) {
        url = url.replaceFirst("^/api/public", "").replaceFirst("^/api", "");
        url = url.replaceAll("[0-9a-fA-F]{24}|\\d+", "?");
        
        Permission permission = this.permissionRepository.getPermission(url, method);
        if (permission == null) {
            return false; // URL/método no configurado, denegar acceso
        }
        
        List<UserRole> userRoles = this.userRoleRepository.findByUserId(user.getId());
        return userRoles.stream().anyMatch(userRole -> {
            Role role = userRole.getRole();
            if (role != null) {
                RolePermission rolePermission = this.rolePermissionRepository
                    .getRolePermission(role.getId(), permission.getId());
                return rolePermission != null;
            }
            return false;
        });
    }
}

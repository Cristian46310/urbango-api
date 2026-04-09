package com.jmmg.ms_security.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public boolean validationRolePermission(HttpServletRequest request, String url, String method) {
        boolean success = false;
        User user = this.getUserFromRequest(request);

        if (user != null) {
            url = url.replaceFirst("^/api/public", "").replaceFirst("^/api", "");
            url = url.replaceAll("[0-9a-fA-F]{24}|\\d+", "?");
            Permission permission = this.permissionRepository.getPermission(url, method);

            List<UserRole> userRoles = this.userRoleRepository.findByUserId(user.getId());
            // el maestro dijo en el video q no era lo suficiente mente eficiente
            success = userRoles.stream().anyMatch(userRole -> {
                Role role = userRole.getRole();
                if (role != null && permission != null) {
                    RolePermission rolePermission = this.rolePermissionRepository.getRolePermission(role.getId(), permission.getId());
                    return rolePermission != null;
                }
                return false;
            });
        }
        return success;

    }

    private User getUserFromRequest(HttpServletRequest request) {
        User user = null;
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith(BEARER)) {
            String token = authHeader.substring(BEARER.length());
            user = this.jwtService.getUserFromToken(token);
            if (user != null) {
                user = this.userRepository.findById(user.getId()).orElse(null);
            }
        }
        return user;
    }
}

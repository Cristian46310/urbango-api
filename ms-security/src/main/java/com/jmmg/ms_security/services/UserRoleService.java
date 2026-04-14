package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.email.EmailSendBody;
import com.jmmg.ms_security.DTOs.Role.AssignRolesDTO;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.User;
import com.jmmg.ms_security.models.UserRole;
import com.jmmg.ms_security.repositories.IRoleRepository;
import com.jmmg.ms_security.repositories.IUserRepository;
import com.jmmg.ms_security.repositories.IUserRoleRepository;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserRoleService {
    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRoleRepository roleRepository;

    @Autowired
    private IUserRoleRepository userRoleRepository;

    @Autowired
    private EmailService emailService;

    public boolean addUserRole(String userId,
            String roleId) {
        User user = this.userRepository.findById(userId).orElse(null);
        Role role = this.roleRepository.findById(roleId).orElse(null);
        if (user != null && role != null) {
            UserRole userRole = new UserRole(user, role);
            this.userRoleRepository.save(userRole);
            return true;
        } else {
            return false;
        }
    }

    public boolean removeUserRole(String userRoleId) {
        UserRole userRole = this.userRoleRepository.findById(userRoleId).orElse(null);
        if (userRole != null) {
            this.userRoleRepository.delete(userRole);
            return true;
        } else {
            return false;
        }
    }

    public boolean assignMultipleRoles(AssignRolesDTO assignRolesDTO) {
        User user = this.userRepository.findById(assignRolesDTO.userId()).orElse(null);
        if (user == null) {
            return false;
        }

        Set<String> requestedRoleIds = assignRolesDTO.roleIds().stream()
                .filter(roleId -> roleId != null && !roleId.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (requestedRoleIds.isEmpty()) {
            return false;
        }

        List<Role> requestedRoles = this.roleRepository.findAllById(requestedRoleIds);
        if (requestedRoles.size() != requestedRoleIds.size()) {
            return false;
        }

        Map<String, Role> requestedRolesById = requestedRoles.stream()
                .collect(Collectors.toMap(Role::getId, Function.identity()));

        List<UserRole> existingRoles = this.userRoleRepository.findByUserId(assignRolesDTO.userId());
        Set<String> existingRoleIds = existingRoles.stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .map(Role::getId)
                .collect(Collectors.toSet());

        List<UserRole> rolesToRemove = existingRoles.stream()
                .filter(userRole -> userRole.getRole() == null || !requestedRoleIds.contains(userRole.getRole().getId()))
                .collect(Collectors.toList());
        if (!rolesToRemove.isEmpty()) {
            this.userRoleRepository.deleteAll(rolesToRemove);
        }

        for (String roleId : requestedRoleIds) {
            if (!existingRoleIds.contains(roleId)) {
                Role role = requestedRolesById.get(roleId);
                this.userRoleRepository.save(new UserRole(user, role));
            }
        }

        String roleNames = requestedRoles.stream()
                .map(Role::getName)
                .collect(Collectors.joining(", "));

        // Construir y enviar notificación por email
        String emailContent = String.format(
                "Hola %s,\n\n"
                        + "Te informamos que tus roles/permisos en el sistema han sido actualizados.\n\n"
                        + "Roles asignados: %s\n\n"
                        + "Si tienes dudas, contacta al administrador.\n\n"
                        + "Saludos,\n"
                        + "Sistema de Seguridad",
                user.getName(), roleNames);

        this.emailService.sendEmail(new EmailSendBody(
                user.getEmail(),
                "Notificacion de Asignacion de Roles",
                emailContent));

        return true;
    }

}
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
        if (user == null || role == null) {
            return false;
        }

        boolean alreadyAssigned = this.userRoleRepository.findByUserId(userId).stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .anyMatch(existingRole -> roleId.equals(existingRole.getId()));
        if (alreadyAssigned) {
            return true;
        }

        this.userRoleRepository.save(new UserRole(user, role));
        return true;
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

    /**
     * Asigna un rol por nombre sin quitar los roles existentes (idempotente).
     */
    public boolean addUserRoleByName(String userId, String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return false;
        }

        User user = this.userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        List<Role> roles = this.roleRepository.findByNameIn(List.of(roleName.trim()));
        if (roles.isEmpty()) {
            return false;
        }

        Role role = roles.get(0);
        boolean alreadyAssigned = this.userRoleRepository.findByUserId(userId).stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .anyMatch(existingRole -> roleName.equalsIgnoreCase(existingRole.getName()));
        if (alreadyAssigned) {
            return true;
        }

        this.userRoleRepository.save(new UserRole(user, role));
        return true;
    }

    /**
     * Agrega roles al usuario sin eliminar los que ya tenía.
     */
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

        List<Role> newlyAddedRoles = new java.util.ArrayList<>();
        for (String roleId : requestedRoleIds) {
            if (!existingRoleIds.contains(roleId)) {
                Role role = requestedRolesById.get(roleId);
                this.userRoleRepository.save(new UserRole(user, role));
                newlyAddedRoles.add(role);
            }
        }

        if (newlyAddedRoles.isEmpty()) {
            return true;
        }

        String roleNames = newlyAddedRoles.stream()
                .map(Role::getName)
                .collect(Collectors.joining(", "));

        // Construir y enviar notificación por email
        String emailContent = String.format(
                "Hola %s,\n\n"
                        + "Te informamos que se te han asignado nuevos roles en el sistema.\n\n"
                        + "Roles agregados: %s\n\n"
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
}
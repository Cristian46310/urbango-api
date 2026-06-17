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

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    /**
     * Agrega un rol al usuario por MongoDB role ID (aditivo, idempotente).
     */
    public boolean addUserRole(String userId, String roleId) {
        if (userId == null || userId.isBlank() || roleId == null || roleId.isBlank()) {
            return false;
        }

        User user = this.userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        Role role = this.roleRepository.findById(roleId).orElse(null);
        if (role == null) {
            return false;
        }

        List<Role> addedRoles = this.appendRoleIdsToUser(user, List.of(roleId), Map.of(roleId, role));
        return !addedRoles.isEmpty() || this.userHasRoleId(userId, roleId);
    }

    public boolean removeUserRole(String userRoleId) {
        UserRole userRole = this.userRoleRepository.findById(userRoleId).orElse(null);
        if (userRole != null) {
            this.userRoleRepository.delete(userRole);
            return true;
        }

        return false;
    }

    /**
     * Agrega roles al usuario por MongoDB role IDs sin eliminar los existentes.
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

        List<Role> newlyAddedRoles = this.appendRoleIdsToUser(
                user,
                new ArrayList<>(requestedRoleIds),
                requestedRolesById);

        if (newlyAddedRoles.isEmpty()) {
            return true;
        }

        String roleNames = newlyAddedRoles.stream()
                .map(Role::getName)
                .collect(Collectors.joining(", "));

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

    private List<Role> appendRoleIdsToUser(
            User user,
            List<String> roleIds,
            Map<String, Role> rolesById) {
        Set<String> existingRoleIds = this.userRoleRepository.findByUserId(user.getId()).stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .map(Role::getId)
                .collect(Collectors.toSet());

        List<Role> newlyAddedRoles = new ArrayList<>();
        for (String roleId : roleIds) {
            if (existingRoleIds.contains(roleId)) {
                continue;
            }

            Role role = rolesById.get(roleId);
            if (role == null) {
                continue;
            }

            this.userRoleRepository.save(new UserRole(user, role));
            existingRoleIds.add(roleId);
            newlyAddedRoles.add(role);
        }

        return newlyAddedRoles;
    }

    private boolean userHasRoleId(String userId, String roleId) {
        return this.userRoleRepository.findByUserId(userId).stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .anyMatch(role -> roleId.equals(role.getId()));
    }

}

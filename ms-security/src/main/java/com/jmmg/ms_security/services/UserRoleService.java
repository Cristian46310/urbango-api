package com.jmmg.ms_security.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserRoleService {
    private static final Logger log = LoggerFactory.getLogger(UserRoleService.class);
    public static final String DEFAULT_CITIZEN_ROLE = "CITIZEN";

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRoleRepository roleRepository;

    @Autowired
    private IUserRoleRepository userRoleRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Agrega un rol al usuario por role ID (aditivo, idempotente).
     */
    public boolean addUserRole(String userId, String roleId) {
        if (userId == null || userId.isBlank() || roleId == null || roleId.isBlank()) {
            return false;
        }

        User user = this.userRepository.findById(UUID.fromString(userId)).orElse(null);
        if (user == null) {
            return false;
        }

        Role role = this.roleRepository.findById(UUID.fromString(roleId)).orElse(null);
        if (role == null) {
            return false;
        }

        String normalizedRoleId = role.getIdAsString();
        List<Role> addedRoles = this.appendRoleIdsToUser(
                user,
                List.of(normalizedRoleId),
                Map.of(normalizedRoleId, role));
        return !addedRoles.isEmpty() || this.userHasRoleId(userId, normalizedRoleId);
    }

    /**
     * Agrega un rol al usuario por nombre (aditivo, idempotente).
     */
    public boolean addUserRoleByName(String userId, String roleName) {
        if (userId == null || userId.isBlank() || roleName == null || roleName.isBlank()) {
            return false;
        }

        User user = this.userRepository.findById(UUID.fromString(userId)).orElse(null);
        if (user == null) {
            return false;
        }

        return this.assignRoleByName(user, roleName.trim().toUpperCase(Locale.ROOT));
    }

    /**
     * Asigna un rol por nombre a un usuario ya persistido (idempotente).
     */
    public boolean assignRoleByName(User user, String roleName) {
        if (user == null || user.getId() == null || roleName == null || roleName.isBlank()) {
            return false;
        }

        String normalizedName = roleName.trim().toUpperCase(Locale.ROOT);
        Optional<Role> roleOpt = this.roleRepository.findByName(normalizedName);
        if (roleOpt.isEmpty()) {
            log.error("Cannot assign role '{}': role not found in database", normalizedName);
            return false;
        }

        Role role = roleOpt.get();
        String roleId = role.getIdAsString();
        List<Role> addedRoles = this.appendRoleIdsToUser(user, List.of(roleId), Map.of(roleId, role));
        return !addedRoles.isEmpty() || this.userHasRoleId(user.getIdAsString(), roleId);
    }

    /**
     * Rol por defecto para usuarios nuevos (como en redes sociales).
     */
    public boolean assignDefaultCitizenRole(User user) {
        boolean assigned = this.assignRoleByName(user, DEFAULT_CITIZEN_ROLE);
        if (!assigned) {
            log.error(
                    "Failed to assign default {} role to user id={}",
                    DEFAULT_CITIZEN_ROLE,
                    user != null ? user.getIdAsString() : null);
        }
        return assigned;
    }

    public boolean removeUserRole(String userRoleId) {
        UserRole userRole = this.userRoleRepository.findById(UUID.fromString(userRoleId)).orElse(null);
        if (userRole != null) {
            this.userRoleRepository.delete(userRole);
            return true;
        }

        return false;
    }

    /**
     * Agrega roles al usuario por role IDs sin eliminar los existentes.
     */
    public boolean assignMultipleRoles(AssignRolesDTO assignRolesDTO) {
        User user = this.userRepository.findById(UUID.fromString(assignRolesDTO.userId())).orElse(null);
        if (user == null) {
            return false;
        }

        Set<String> requestedRoleIds = assignRolesDTO.roleIds().stream()
                .filter(roleId -> roleId != null && !roleId.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (requestedRoleIds.isEmpty()) {
            return false;
        }

        List<UUID> requestedRoleUuids = requestedRoleIds.stream().map(UUID::fromString).toList();
        List<Role> requestedRoles = this.roleRepository.findAllById(requestedRoleUuids);
        if (requestedRoles.size() != requestedRoleIds.size()) {
            return false;
        }

        Map<String, Role> requestedRolesById = requestedRoles.stream()
                .collect(Collectors.toMap(Role::getIdAsString, Function.identity(), (a, b) -> a));

        List<String> normalizedRequestedIds = requestedRoles.stream()
                .map(Role::getIdAsString)
                .toList();

        List<Role> newlyAddedRoles = this.appendRoleIdsToUser(
                user,
                new ArrayList<>(normalizedRequestedIds),
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

        try {
            this.emailService.sendEmail(new EmailSendBody(
                    user.getEmail(),
                    "Notificacion de Asignacion de Roles",
                    emailContent));
        } catch (Exception e) {
            log.warn(
                    "Roles assigned to user {} but notification email failed: {}",
                    user.getIdAsString(),
                    e.getMessage());
        }

        return true;
    }

    private List<Role> appendRoleIdsToUser(
            User user,
            List<String> roleIds,
            Map<String, Role> rolesById) {
        Set<String> existingRoleIds = this.userRoleRepository.findByUserId(user.getId()).stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .map(Role::getIdAsString)
                .map(this::normalizeId)
                .collect(Collectors.toSet());

        Map<String, Role> rolesByNormalizedId = rolesById.entrySet().stream()
                .collect(Collectors.toMap(
                        e -> this.normalizeId(e.getKey()),
                        Map.Entry::getValue,
                        (a, b) -> a));

        List<Role> newlyAddedRoles = new ArrayList<>();
        for (String roleId : roleIds) {
            String normalizedRoleId = this.normalizeId(roleId);
            if (existingRoleIds.contains(normalizedRoleId)) {
                continue;
            }

            Role role = rolesByNormalizedId.get(normalizedRoleId);
            if (role == null) {
                continue;
            }

            this.userRoleRepository.save(new UserRole(user, role));
            existingRoleIds.add(normalizedRoleId);
            newlyAddedRoles.add(role);
        }

        return newlyAddedRoles;
    }

    private boolean userHasRoleId(String userId, String roleId) {
        String normalizedRoleId = this.normalizeId(roleId);
        return this.userRoleRepository.findByUserId(userId).stream()
                .map(UserRole::getRole)
                .filter(java.util.Objects::nonNull)
                .map(Role::getIdAsString)
                .map(this::normalizeId)
                .anyMatch(normalizedRoleId::equals);
    }

    private String normalizeId(String id) {
        return id == null ? null : id.trim().toLowerCase(Locale.ROOT);
    }

}

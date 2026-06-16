package com.jmmg.ms_security.services;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.DTOs.permission.PostPermissionDTO;
import com.jmmg.ms_security.models.Method;
import com.jmmg.ms_security.models.Permission;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.repositories.IRolePermissionRepository;
import com.jmmg.ms_security.repositories.IPermissionRepository;
import com.jmmg.ms_security.repositories.IRoleRepository;

@Service
public class PermissionService {

    private final IPermissionRepository permissionRepository;
    private final IRoleRepository roleRepository;
    private final IRolePermissionRepository rolePermissionRepository;

    public PermissionService(
            IPermissionRepository permissionRepository,
            IRoleRepository roleRepository,
            IRolePermissionRepository rolePermissionRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    public Page<GetPermissionDTO> find(Pageable pageable) {
        return this.permissionRepository.findAll(pageable)
                .map(GetPermissionDTO::fromModel);
    }

    public GetPermissionDTO findById(String id) {
        Permission permission = this.permissionRepository.findById(id).orElse(null);
        return GetPermissionDTO.fromModel(permission);
    }

    public GetPermissionDTO create(PostPermissionDTO postPermissionDTO) {
        Permission newPermission = new Permission(postPermissionDTO);
        Permission savedPermission = this.permissionRepository.save(newPermission);
        return GetPermissionDTO.fromModel(savedPermission);
    }

    public GetPermissionDTO update(String id, PostPermissionDTO postPermissionDTO) {
        Permission actualPermission = this.permissionRepository.findById(id).orElse(null);

        if (actualPermission != null) {
            actualPermission.updateFromDTO(postPermissionDTO);
            this.permissionRepository.save(actualPermission);
            return GetPermissionDTO.fromModel(actualPermission);
        } else {
            return null;
        }
    }

    public void delete(String id) {
        Permission permission = this.permissionRepository.findById(id).orElse(null);
        if (permission != null) {
            this.permissionRepository.delete(permission);
        }
    }

    public boolean isAllowed(List<String> roles, String method, String url) {
        if (roles == null || roles.isEmpty() || method == null || url == null) {
            return false;
        }

        Method normalizedMethod;
        try {
            normalizedMethod = Method.valueOf(method.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return false;
        }

        Set<String> normalizedRoleNames = roles.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .map(role -> role.toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (normalizedRoleNames.isEmpty()) {
            return false;
        }

        List<Role> matchingRoles = this.roleRepository.findByNameIn(normalizedRoleNames);
        if (matchingRoles.isEmpty()) {
            return false;
        }

        List<ObjectId> roleIds = matchingRoles.stream()
            .map(Role::getId)
            .filter(Objects::nonNull)
            .filter(ObjectId::isValid)
            .map(ObjectId::new)
            .toList();

        if (roleIds.isEmpty()) {
            return false;
        }

        return this.permissionRepository.findByMethod(normalizedMethod).stream()
                .filter(permission -> matchesUrlPattern(permission.getUrl(), url))
                .anyMatch(permission -> this.rolePermissionRepository.existsByRoleIdsAndPermissionId(roleIds,
                        permission.getId()));
    }

    private boolean matchesUrlPattern(String storedPattern, String incomingUrl) {
        if (storedPattern == null || incomingUrl == null) {
            return false;
        }

        String pattern = storedPattern.trim();

        // Prefijo: /route/* coincide con /route/uuid y /route/uuid/comments
        if (pattern.endsWith("/*") && !pattern.substring(0, pattern.length() - 2).contains("/*")) {
            String prefix = pattern.substring(0, pattern.length() - 2);
            return incomingUrl.startsWith(prefix);
        }

        // Comodín por segmento: /incident-reports/*/comments
        if (pattern.contains("/*")) {
            String regex = pattern
                    .replace("/", "\\/")
                    .replace("/*", "/[^/]+");
            return incomingUrl.matches("^" + regex + "$");
        }

        return pattern.equals(incomingUrl);
    }
}
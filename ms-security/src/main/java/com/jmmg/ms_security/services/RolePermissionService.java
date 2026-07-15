package com.jmmg.ms_security.services;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.permission.AssignPermissionsDTO;
import com.jmmg.ms_security.models.Permission;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.models.RolePermission;
import com.jmmg.ms_security.repositories.IPermissionRepository;
import com.jmmg.ms_security.repositories.IRolePermissionRepository;
import com.jmmg.ms_security.repositories.IRoleRepository;

@Service
public class RolePermissionService {

    @Autowired
    private IRoleRepository roleRepository;

    @Autowired
    private IPermissionRepository permissionRepository;

    @Autowired
    private IRolePermissionRepository rolePermissionRepository;

    public boolean addRolePermission(String roleId, String permissionId) {
        Role role = this.roleRepository.findById(UUID.fromString(roleId)).orElse(null);
        Permission permission = this.permissionRepository.findById(UUID.fromString(permissionId)).orElse(null);

        if (role != null && permission != null) {
            RolePermission existingRolePermission = this.rolePermissionRepository.getRolePermission(roleId, permissionId);
            if (existingRolePermission != null) {
                return true;
            }

            RolePermission rolePermission = new RolePermission(role, permission);
            this.rolePermissionRepository.save(rolePermission);
            return true;
        } else {
            return false;
        }
    }

    public boolean assignMultiplePermissions(AssignPermissionsDTO assignPermissionsDTO) {
        Role role = this.roleRepository.findById(UUID.fromString(assignPermissionsDTO.roleId())).orElse(null);
        if (role == null) {
            return false;
        }

        Set<String> requestedPermissionIds = assignPermissionsDTO.permissionIds().stream()
                .filter(permissionId -> permissionId != null && !permissionId.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (requestedPermissionIds.isEmpty()) {
            return false;
        }

        List<UUID> requestedPermissionUuids = requestedPermissionIds.stream().map(UUID::fromString).toList();
        List<Permission> requestedPermissions = this.permissionRepository.findAllById(requestedPermissionUuids);
        if (requestedPermissions.size() != requestedPermissionIds.size()) {
            return false;
        }

        Map<String, Permission> requestedPermissionsById = requestedPermissions.stream()
                .collect(Collectors.toMap(Permission::getIdAsString, Function.identity()));

        List<RolePermission> existingPermissions = this.rolePermissionRepository.findByRoleId(assignPermissionsDTO.roleId());
        Set<String> existingPermissionIds = existingPermissions.stream()
                .map(RolePermission::getPermission)
                .filter(java.util.Objects::nonNull)
                .map(Permission::getIdAsString)
                .collect(Collectors.toSet());

        List<RolePermission> permissionsToRemove = existingPermissions.stream()
                .filter(rolePermission -> rolePermission.getPermission() == null
                        || !requestedPermissionIds.contains(rolePermission.getPermission().getIdAsString()))
                .collect(Collectors.toList());
        if (!permissionsToRemove.isEmpty()) {
            this.rolePermissionRepository.deleteAll(permissionsToRemove);
        }

        for (String permissionId : requestedPermissionIds) {
            if (!existingPermissionIds.contains(permissionId)) {
                Permission permission = requestedPermissionsById.get(permissionId);
                this.rolePermissionRepository.save(new RolePermission(role, permission));
            }
        }

        return true;
    }

    public boolean removeRolePermission(String rolePermissionId) {
        RolePermission rolePermission = this.rolePermissionRepository.findById(UUID.fromString(rolePermissionId)).orElse(null);
        if (rolePermission != null) {
            this.rolePermissionRepository.delete(rolePermission);
            return true;
        } else {
            return false;
        }
    }
}

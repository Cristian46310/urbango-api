package com.jmmg.ms_security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        Role role = this.roleRepository.findById(roleId).orElse(null);
        Permission permission = this.permissionRepository.findById(permissionId).orElse(null);

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

    public boolean removeRolePermission(String rolePermissionId) {
        RolePermission rolePermission = this.rolePermissionRepository.findById(rolePermissionId).orElse(null);
        if (rolePermission != null) {
            this.rolePermissionRepository.delete(rolePermission);
            return true;
        } else {
            return false;
        }
    }
}

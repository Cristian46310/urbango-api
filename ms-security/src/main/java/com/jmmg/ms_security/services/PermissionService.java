package com.jmmg.ms_security.services;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.DTOs.permission.PostPermissionDTO;
import com.jmmg.ms_security.models.Permission;
import com.jmmg.ms_security.repositories.IPermissionRepository;

@Service
public class PermissionService {

    private final IPermissionRepository permissionRepository;

    public PermissionService(IPermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
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

        String normalizedMethod = method.toUpperCase();
        List<Permission> matchingPermissions = this.permissionRepository
                .findByRolesAndMethod(roles, normalizedMethod);

        return matchingPermissions.stream()
                .anyMatch(permission -> matchesUrlPattern(permission.getUrl(), url));
    }

    private boolean matchesUrlPattern(String storedPattern, String incomingUrl) {
        if (storedPattern.endsWith("/*")) {
            String prefix = storedPattern.substring(0, storedPattern.length() - 2);
            return incomingUrl.startsWith(prefix);
        }
        return storedPattern.equals(incomingUrl);
    }
}
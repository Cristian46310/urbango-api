package com.jmmg.ms_security.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.DTOs.permission.PostPermissionDTO;
import com.jmmg.ms_security.models.Permission;
import com.jmmg.ms_security.repositories.IPermissionRepository;

@Service
public class PermissionService {

    @Autowired
    private IPermissionRepository permissionRepository;

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
}

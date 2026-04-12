package com.jmmg.ms_security.services;

import com.jmmg.ms_security.DTOs.permission.GetPermissionDTO;
import com.jmmg.ms_security.DTOs.Role.GetRoleDTO;
import com.jmmg.ms_security.DTOs.Role.GetRoleListDTO;
import com.jmmg.ms_security.DTOs.Role.PostRoleDTO;
import com.jmmg.ms_security.models.RolePermission;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.repositories.IRolePermissionRepository;
import com.jmmg.ms_security.repositories.IRoleRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    @Autowired
    private IRoleRepository roleRepository;
    @Autowired
    private IRolePermissionRepository rolePermissionRepository;

    public Page<GetRoleListDTO> find(Pageable pageable) {
        return this.roleRepository.findAll(pageable)
                .map(GetRoleListDTO::fromModel);
    }

    public GetRoleDTO findById(String id) {
        Role role = this.roleRepository.findById(id).orElse(null);
        return this.toGetRoleDTO(role);
    }

    public GetRoleDTO create(PostRoleDTO postRoleDTO) {
        Role newRole = new Role(postRoleDTO);
        Role savedRole = this.roleRepository.save(newRole);
        return this.toGetRoleDTO(savedRole);
    }

    public GetRoleDTO update(String id, PostRoleDTO postRoleDTO) {
        Role actualRole = this.roleRepository.findById(id).orElse(null);

        if (actualRole != null) {
            actualRole.updateFromDTO(postRoleDTO);
            this.roleRepository.save(actualRole);
            return this.toGetRoleDTO(actualRole);
        } else {
            return null;
        }
    }

    public void delete(String id) {
        Role theRole = this.roleRepository.findById(id).orElse(null);
        if (theRole != null) {
            this.roleRepository.delete(theRole);
        }
    }

    private GetRoleDTO toGetRoleDTO(Role role) {
        if (role == null) {
            return null;
        }

        List<GetPermissionDTO> permissions = this.rolePermissionRepository.findByRoleId(role.getId())
                .stream()
                .map(RolePermission::getPermission)
                .filter(java.util.Objects::nonNull)
                .map(GetPermissionDTO::fromModel)
                .collect(java.util.stream.Collectors.toList());

        return GetRoleDTO.fromModel(role, permissions);
    }
}

package com.jmmg.ms_security.services;

import com.jmmg.ms_security.DTOs.GetRoleDTO;
import com.jmmg.ms_security.DTOs.PostRoleDTO;
import com.jmmg.ms_security.models.Role;
import com.jmmg.ms_security.repositories.IRoleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    @Autowired
    private IRoleRepository roleRepository;

    public List<GetRoleDTO> find() {
        return this.roleRepository.findAll().stream().map(GetRoleDTO::fromModel)
                .collect(java.util.stream.Collectors.toList());
    }

    public GetRoleDTO findById(String id) {
        Role role = this.roleRepository.findById(id).orElse(null);
        return GetRoleDTO.fromModel(role);
    }

    public GetRoleDTO create(PostRoleDTO postRoleDTO) {
        Role newRole = new Role(postRoleDTO);
        Role savedRole = this.roleRepository.save(newRole);
        return GetRoleDTO.fromModel(savedRole);
    }

    public GetRoleDTO update(String id, PostRoleDTO postRoleDTO) {
        Role actualRole = this.roleRepository.findById(id).orElse(null);

        if (actualRole != null) {
            actualRole.updateFromDTO(postRoleDTO);
            this.roleRepository.save(actualRole);
            return GetRoleDTO.fromModel(actualRole);
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
}

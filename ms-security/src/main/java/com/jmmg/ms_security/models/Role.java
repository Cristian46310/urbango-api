package com.jmmg.ms_security.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jmmg.ms_security.DTOs.Role.GetRoleDTO;
import com.jmmg.ms_security.DTOs.Role.PostRoleDTO;

@Data
@Document
@CompoundIndex(name = "role_name_unique_idx", def = "{'name': 1}", unique = true)
public class Role {
    @Id
    private String id;
    private String name; // ADMIN, BUSINESS_ADMIN, SUPERVISOR, DRIVER, CITEZEN
    private String description;

    public Role(){

    }

    public Role(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Role(GetRoleDTO getRoleDTO) {
        this.id = getRoleDTO.id();
        this.name = getRoleDTO.name();
        this.description = getRoleDTO.description();
    }

    public Role(PostRoleDTO postRoleDTO) {
        this.name = postRoleDTO.name();
        this.description = postRoleDTO.description();
    }

    public void updateFromDTO(PostRoleDTO postRoleDTO) {
        this.name = postRoleDTO.name();
        this.description = postRoleDTO.description();
    }
}

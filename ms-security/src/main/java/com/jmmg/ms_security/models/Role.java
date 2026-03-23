package com.jmmg.ms_security.models;

import com.jmmg.ms_security.DTOs.GetRoleDTO;
import com.jmmg.ms_security.DTOs.PostRoleDTO;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
public class Role {
    @Id
    private String id;
    private String name;
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

package com.jmmg.ms_security.models;

import java.util.UUID;

import com.jmmg.ms_security.DTOs.Role.GetRoleDTO;
import com.jmmg.ms_security.DTOs.Role.PostRoleDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "roles", schema = "security")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    public Role() {
    }

    public Role(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Role(GetRoleDTO getRoleDTO) {
        this.setIdFromString(getRoleDTO.id());
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

    public String getIdAsString() {
        return id == null ? null : id.toString();
    }

    public void setIdFromString(String id) {
        this.id = id == null || id.isBlank() ? null : UUID.fromString(id);
    }
}

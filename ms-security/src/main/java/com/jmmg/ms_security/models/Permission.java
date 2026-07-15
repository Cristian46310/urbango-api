package com.jmmg.ms_security.models;

import java.util.UUID;

import com.jmmg.ms_security.DTOs.permission.PostPermissionDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "permissions", schema = "security")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 512)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Method method;

    public Permission() {
    }

    public Permission(String url, Method method) {
        this.url = url;
        this.method = method;
    }

    public Permission(PostPermissionDTO postPermissionDTO) {
        this.url = postPermissionDTO.url();
        this.method = postPermissionDTO.method();
    }

    public void updateFromDTO(PostPermissionDTO postPermissionDTO) {
        this.url = postPermissionDTO.url();
        this.method = postPermissionDTO.method();
    }

    public String getIdAsString() {
        return id == null ? null : id.toString();
    }

    public void setIdFromString(String id) {
        this.id = id == null || id.isBlank() ? null : UUID.fromString(id);
    }
}

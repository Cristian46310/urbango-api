package com.jmmg.ms_security.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.jmmg.ms_security.DTOs.permission.PostPermissionDTO;

import lombok.Data;

@Data
@Document
public class Permission {
    @Id
    private String id;

    private String url;
    private String method;

    public Permission() {
    }

    public Permission(String url, String method) {
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
}
